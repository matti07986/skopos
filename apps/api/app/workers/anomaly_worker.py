import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func

from app.database import AsyncSessionLocal
from app.models.log_event import LogEvent
from app.models.project import Project
from app.models.user import User
from app.models.alert import AlertEvent
from app.services.email_service import send_alert_email

logger = logging.getLogger(__name__)

POLL_INTERVAL = 60
SPIKE_MULTIPLIER = 3.0
MIN_BASELINE_EVENTS = 10


async def _check_project_anomalies(project_id: uuid.UUID, owner: User) -> None:
    if not owner.notify_alerts:
        return

    now = datetime.now(timezone.utc)
    last_5min = now - timedelta(minutes=5)
    last_24h = now - timedelta(hours=24)

    async with AsyncSessionLocal() as db:
        recent_errors = (await db.execute(
            select(func.count()).where(
                LogEvent.project_id == project_id,
                LogEvent.level == "ERROR",
                LogEvent.timestamp >= last_5min,
            )
        )).scalar() or 0

        if recent_errors < 3:
            return

        total_errors_24h = (await db.execute(
            select(func.count()).where(
                LogEvent.project_id == project_id,
                LogEvent.level == "ERROR",
                LogEvent.timestamp >= last_24h,
                LogEvent.timestamp < last_5min,
            )
        )).scalar() or 0

        baseline_per_5min = total_errors_24h / 287 if total_errors_24h > MIN_BASELINE_EVENTS else 0

        if baseline_per_5min == 0:
            return

        if recent_errors >= baseline_per_5min * SPIKE_MULTIPLIER:
            logger.warning(
                "Anomaly detected: project=%s errors=%d baseline=%.1f (%.1fx)",
                project_id, recent_errors, baseline_per_5min,
                recent_errors / baseline_per_5min
            )

            try:
                await send_alert_email(
                    to=owner.email,
                    rule_name="Anomaly Detection — Error Spike",
                    level="ERROR",
                    count=recent_errors,
                    triggered_at=now.isoformat(),
                )
            except Exception as e:
                logger.warning("Failed to send anomaly email: %s", e)

            async with AsyncSessionLocal() as db2:
                ev = AlertEvent(
                    id=uuid.uuid4(),
                    rule_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                    payload={
                        "type": "anomaly",
                        "project_id": str(project_id),
                        "recent_errors": recent_errors,
                        "baseline": baseline_per_5min,
                        "multiplier": recent_errors / baseline_per_5min,
                        "triggered_at": now.isoformat(),
                    },
                    sent=True,
                )
                db2.add(ev)
                await db2.commit()


async def run() -> None:
    logger.info("Anomaly worker avviato (polling ogni %ds)", POLL_INTERVAL)
    while True:
        try:
            async with AsyncSessionLocal() as db:
                projects = (await db.execute(select(Project))).scalars().all()

            for project in projects:
                try:
                    async with AsyncSessionLocal() as db:
                        owner = (await db.execute(
                            select(User).where(User.id == project.user_id)
                        )).scalar_one_or_none()
                    if owner:
                        await _check_project_anomalies(project.id, owner)
                except Exception:
                    logger.exception("Anomaly check failed for project %s", project.id)

        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Anomaly worker crashed — riavvio tra 60s")
            await asyncio.sleep(60)
            continue

        await asyncio.sleep(POLL_INTERVAL)
