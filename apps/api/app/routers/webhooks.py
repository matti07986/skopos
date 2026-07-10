import hashlib
import hmac
import json

from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends

from app.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter()

PLAN_MAP = {
    "indie": "indie",
    "pro": "pro",
    "business": "business",
}


def verify_signature(payload: bytes, signature: str) -> bool:
    secret = settings.lemonsqueezy_webhook_secret.encode()
    expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhooks/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("X-Signature", "")

    if not verify_signature(payload, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = json.loads(payload)
    event = data.get("meta", {}).get("event_name", "")
    attrs = data.get("data", {}).get("attributes", {})
    email = attrs.get("user_email", "")

    if not email:
        return {"ok": True}

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return {"ok": True}

    if event in ("subscription_created", "subscription_updated", "subscription_resumed"):
        product_name = attrs.get("product_name", "").lower()
        new_plan = PLAN_MAP.get(product_name, user.plan)
        user.plan = new_plan
        # Track active LS subscription — trial_worker treats NULL as "never paid"
        sub_id = data.get("data", {}).get("id")
        if sub_id:
            user.lemon_subscription_id = str(sub_id)

    elif event in ("subscription_expired",):
        user.plan = "starter"
        user.lemon_subscription_id = None

    await db.commit()
    return {"ok": True}
