import json
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, validator

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.deps import get_current_project
from app.models.project import Project
from app.models.user import User
from app.services.redis_service import publish_log, get_redis
from app.services.pii_service import redact_pii, redact_dict
from app.config import settings

router = APIRouter()


class LogEventIn(BaseModel):
    level: Literal["ERROR", "WARN", "INFO", "DEBUG"]
    message: str
    service: str
    event_metadata: dict = {}
    timestamp: Optional[datetime] = None

    @validator("message")
    def message_length(cls, v):
        if len(v) > 10000:
            raise ValueError("Message too long (max 10000 characters)")
        return v

    @validator("service")
    def service_length(cls, v):
        if len(v) > 100:
            raise ValueError("Service name too long (max 100 characters)")
        return v

    @validator("event_metadata")
    def metadata_size(cls, v):
        if len(json.dumps(v)) > 50000:
            raise ValueError("Metadata too large (max 50KB)")
        return v


class IngestResponse(BaseModel):
    accepted: int


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest log events",
    description="Usa la Project API Key nell'header X-API-Key. Body: array JSON diretto `[{...}, {...}]`.",
)
async def ingest(
    events: list[LogEventIn],
    project: Project = Depends(get_current_project),
):
    if not events:
        raise HTTPException(status_code=400, detail="Empty payload")

    # Recupera piano dell'owner — cached in Redis with 60s TTL to avoid
    # a DB roundtrip on every ingest request. Plan changes are rare
    # (manual upgrade/downgrade) so 60s staleness is acceptable.
    # This saves one DB connection per request, which was the dominant
    # factor in pool exhaustion observed at >100 concurrent req/s.
    r = get_redis()
    plan_key = f"user_plan:{project.user_id}"
    plan = await r.get(plan_key)
    if plan is None:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == project.user_id))
            owner = result.scalar_one_or_none()
        plan = owner.plan if owner else "starter"
        await r.setex(plan_key, 60, plan)

    batch_limit = settings.plan_limits.get(plan, 10_000)

    # Rate limiting per piano — req/min
    rate_limits = {
        "starter":  100,
        "indie":    500,
        "pro":      2_000,
        "business": 10_000,
    }
    max_req_per_min = rate_limits.get(plan, 100)

    # Cap orario di EVENTI INGERITI per piano (anti-abuse, anti-fill-disk)
    hourly_event_caps = {
        "starter":     10_000,
        "indie":      100_000,
        "pro":        500_000,
        "business": 5_000_000,
    }
    max_events_per_hour = hourly_event_caps.get(plan, 10_000)

    # Use the shared Redis pool from redis_service. Previously this created a
    # fresh aioredis client per request + aclose() — under load that added
    # ~5-10ms of TCP setup overhead per request and contributed to k6 EOFs
    # when the server got behind. Pool is created once at module load and
    # reused across all workers / requests.
    r = get_redis()

    # 1) Anti-burst: rate limit richieste/minuto
    rate_key = f"ingest_rate:{project.id}"
    current = await r.incr(rate_key)
    if current == 1:
        await r.expire(rate_key, 60)
    if current > max_req_per_min:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded for your plan ({max_req_per_min} req/min). Upgrade to increase limits.")

    # 2) Cap orario sul totale di EVENTI ingeriti (non solo richieste)
    events_key = f"ingest_events_hour:{project.id}"
    new_count = await r.incrby(events_key, len(events))
    if new_count == len(events):
        await r.expire(events_key, 3600)
    if new_count > max_events_per_hour:
        # rollback del contatore di questa richiesta
        await r.decrby(events_key, len(events))
        raise HTTPException(
            status_code=429,
            detail=f"Hourly event limit reached for your plan ({max_events_per_hour:,} events/hour). Upgrade to increase limits."
        )

    # Limite hard sul singolo batch (anti-megaupload)
    MAX_BATCH = 5_000
    if len(events) > MAX_BATCH:
        raise HTTPException(status_code=413, detail=f"Batch too large (max {MAX_BATCH} events per request)")

    for ev in events:
        payload = {
            "id": str(uuid.uuid4()),
            "project_id": str(project.id),
            "timestamp": (ev.timestamp or datetime.now(timezone.utc)).isoformat(),
            "level": ev.level,
            "message": redact_pii(ev.message),
            "service": ev.service,
            "event_metadata": redact_dict(ev.event_metadata),
        }
        await publish_log(payload)

    return IngestResponse(accepted=len(events))
