import asyncio
import logging
import uuid
from datetime import datetime, timezone

import hashlib
import hmac
import json
import httpx
import redis.asyncio as aioredis

from app.database import AsyncSessionLocal
from app.models.alert import AlertRule, AlertEvent
from app.models.project import Project
from app.models.user import User
from app.services.email_service import send_alert_email
from app.services.redis_service import consume_stream, STREAM_LOGS
from sqlalchemy import select

logger = logging.getLogger(__name__)

GROUP = "alert-group"
CONSUMER = "alert-worker-1"
REDIS_URL = "redis://redis:6379"


async def _increment_counter(r: aioredis.Redis, key: str, window_seconds: int) -> int:
    now = datetime.now(timezone.utc).timestamp()
    pipe = r.pipeline()
    await pipe.zadd(f"counter:{key}", {str(now): now})
    await pipe.zremrangebyscore(f"counter:{key}", 0, now - window_seconds)
    await pipe.zcard(f"counter:{key}")
    await pipe.expire(f"counter:{key}", window_seconds * 2)
    results = await pipe.execute()
    return results[2]


async def _reset_counter(r: aioredis.Redis, key: str) -> None:
    await r.delete(f"counter:{key}")


async def _fire_alert(rule: AlertRule, count: int) -> None:
    payload = {
        "rule": rule.name,
        "level": rule.level,
        "count": count,
        "triggered_at": datetime.now(timezone.utc).isoformat(),
    }

    error_msg = None
    try:
        if rule.channel == "slack":
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(rule.destination, json={"text": f"[NovaTrace] {rule.name}: {count} eventi {rule.level}"})
                resp.raise_for_status()
        elif rule.channel == "email":
            await send_alert_email(
                to=rule.destination,
                rule_name=rule.name,
                level=rule.level,
                count=count,
                triggered_at=payload["triggered_at"],
            )
        elif rule.channel == "webhook":
            body = json.dumps(payload).encode()
            secret = (rule.webhook_secret or "").encode()
            signature = hmac.new(secret, body, hashlib.sha256).hexdigest()
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    rule.destination,
                    content=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Skopos-Signature": f"sha256={signature}",
                        "X-Skopos-Event": "alert.triggered",
                        "User-Agent": "NovaTrace-Webhook/1.0",
                    }
                )
                resp.raise_for_status()
    except Exception as e:
        error_msg = str(e)
        logger.warning("Errore invio alert %s: %s", rule.name, e)

    async with AsyncSessionLocal() as db:
        ev = AlertEvent(
            id=uuid.uuid4(),
            rule_id=rule.id,
            payload=payload,
            sent=error_msg is None,
            error=error_msg,
        )
        db.add(ev)
        await db.commit()


async def run() -> None:
    logger.info("Alert worker avviato")
    r = aioredis.from_url(REDIS_URL)
    try:
        async for _msg_id, event in consume_stream(STREAM_LOGS, GROUP, CONSUMER):
            project_id = event.get("project_id", "")
            level = event.get("level", "")
            key = f"{project_id}:{level}"

            try:
                async with AsyncSessionLocal() as db:
                    result = await db.execute(
                        select(AlertRule).where(
                            AlertRule.project_id == uuid.UUID(project_id),
                            AlertRule.level == level,
                            AlertRule.is_active == True,
                        )
                    )
                    rules = result.scalars().all()

                for rule in rules:
                    count = await _increment_counter(r, key, rule.window_seconds)
                    if count >= rule.threshold:
                        # Check se l'utente vuole notifiche
                        async with AsyncSessionLocal() as db:
                            proj = (await db.execute(
                                select(Project).where(Project.id == rule.project_id)
                            )).scalar_one_or_none()
                            if proj:
                                owner = (await db.execute(
                                    select(User).where(User.id == proj.user_id)
                                )).scalar_one_or_none()
                                if owner and not owner.notify_alerts:
                                    await _reset_counter(r, key)
                                    continue
                        await _fire_alert(rule, count)
                        await _reset_counter(r, key)
            except Exception:
                logger.exception("Errore alert worker per evento %s", event.get("id"))

            await asyncio.sleep(0)
    finally:
        await r.aclose()
