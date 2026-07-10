"""
Pre-registration endpoint for pre-launch waiting list.
"""
import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.models.preregistration_email import PreregistrationEmail


logger = logging.getLogger(__name__)
router = APIRouter()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")


class PreregisterRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = Field(default=None, max_length=128)
    use_case: Optional[str] = Field(default=None, max_length=500)


class PreregisterResponse(BaseModel):
    detail: str


def _get_client_ip(request: Request) -> str:
    """Real client IP behind reverse proxy. X-Forwarded-For first hop wins."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post(
    "/auth/preregister",
    response_model=PreregisterResponse,
    status_code=status.HTTP_200_OK,
)
async def preregister(
    body: PreregisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Pre-registration for the upcoming launch.

    Idempotent: returns success even if email already registered (don't reveal
    existence). Rate limited per IP (5 attempts / 15 min).
    """
    client_ip = _get_client_ip(request)
    r = aioredis.from_url(REDIS_URL)
    try:
        # Rate limit per IP
        rate_key = f"preregister:ip:{client_ip}"
        attempts = await r.get(rate_key)
        if attempts and int(attempts) >= 5:
            ttl = await r.ttl(rate_key)
            retry_after = max(ttl, 60) if ttl > 0 else 900
            logger.warning(f"Pre-registration rate limit hit from ip={client_ip}")
            raise HTTPException(
                status_code=429,
                detail="Too many pre-registration attempts. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        # Check duplicate (idempotent)
        existing = await db.execute(
            select(PreregistrationEmail).where(
                PreregistrationEmail.email == body.email
            )
        )
        if existing.scalar_one_or_none() is not None:
            logger.info(
                f"Pre-registration duplicate for {body.email} from ip={client_ip}"
            )
            return PreregisterResponse(
                detail="You're on the list. We'll let you know when we launch."
            )

        # Insert
        preregistration = PreregistrationEmail(
            email=body.email,
            name=body.name,
            use_case=body.use_case,
            ip_address=client_ip,
        )
        db.add(preregistration)
        await db.commit()

        # Rate limit: count successful submissions too
        await r.incr(rate_key)
        await r.expire(rate_key, 900)

        logger.info(f"New pre-registration: {body.email} from ip={client_ip}")
        return PreregisterResponse(
            detail="You're on the list. We'll let you know when we launch."
        )
    finally:
        await r.aclose()
