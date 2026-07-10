import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.database import AsyncSessionLocal
from app.models.log_event import LogEvent, AiInsight
from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)

POLL_INTERVAL = 60 * 60  # ogni ora
RETENTION_DAYS = {
    "starter": 7,
    "indie":   21,
    "pro":     60,
    "business": 90,
}
DEFAULT_RETENTION_DAYS = 7


async def _delete_old_logs() -> None:
    async with AsyncSessionLocal() as db:
        # Recupera tutti gli utenti con i loro progetti
        users = (await db.execute(select(User))).scalars().all()

        total_deleted = 0
        for user in users:
            retention_days = RETENTION_DAYS.get(user.plan, DEFAULT_RETENTION_DAYS)
            cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)

            # Prendi i project_id dell'utente
            projects = (await db.execute(
                select(Project.id).where(Project.user_id == user.id)
            )).scalars().all()

            if not projects:
                continue

            # Cancella log vecchi
            result = await db.execute(
                delete(LogEvent).where(
                    LogEvent.project_id.in_(projects),
                    LogEvent.timestamp < cutoff,
                )
            )
            deleted = result.rowcount
            total_deleted += deleted

            # Cancella AiInsight vecchi (stessa retention dei log)
            ai_result = await db.execute(
                delete(AiInsight).where(
                    AiInsight.project_id.in_(projects),
                    AiInsight.created_at < cutoff,
                )
            )
            total_deleted += ai_result.rowcount

        await db.commit()
        if total_deleted > 0:
            logger.info("Retention worker: eliminati %d log vecchi", total_deleted)


async def run() -> None:
    logger.info("Retention worker avviato (ogni %dh)", POLL_INTERVAL // 3600)
    while True:
        try:
            await _delete_old_logs()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Retention worker crashed — riavvio tra 60s")
            await asyncio.sleep(60)
            continue

        await asyncio.sleep(POLL_INTERVAL)
