import asyncio
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func

from app.database import AsyncSessionLocal
from app.models.log_event import AiInsight, LogEvent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

POLL_INTERVAL = 60
MIN_OCCURRENCES = 5

# Namespace fisso per derivare UUID deterministici dai fingerprint
_NAMESPACE = uuid.UUID("b3e2a1c0-dead-beef-cafe-000000000000")


def _fingerprint_to_uuid(fingerprint: str) -> uuid.UUID:
    return uuid.uuid5(_NAMESPACE, fingerprint)


async def _find_unanalyzed_patterns() -> list[dict]:
    async with AsyncSessionLocal() as db:
        # Fingerprint con 5+ occorrenze
        stmt = (
            select(
                LogEvent.fingerprint,
                LogEvent.level,
                LogEvent.service,
                LogEvent.project_id,
                func.count().label("cnt"),
            )
            .where(LogEvent.fingerprint.is_not(None))
            .group_by(LogEvent.fingerprint, LogEvent.level, LogEvent.service, LogEvent.project_id)
            .having(func.count() >= MIN_OCCURRENCES)
        )
        patterns = (await db.execute(stmt)).all()

        if not patterns:
            return []

        # Pattern già analizzati
        analyzed_ids: set[uuid.UUID] = set(
            (await db.execute(select(AiInsight.pattern_id))).scalars().all()
        )

        return [
            {
                "fingerprint": p.fingerprint,
                "level": p.level,
                "service": p.service,
                "project_id": p.project_id,
                "count": p.cnt,
                "pattern_id": _fingerprint_to_uuid(p.fingerprint),
            }
            for p in patterns
            if _fingerprint_to_uuid(p.fingerprint) not in analyzed_ids
        ]


async def _fetch_sample_messages(fingerprint: str, limit: int = 10) -> list[str]:
    async with AsyncSessionLocal() as db:
        stmt = (
            select(LogEvent.message)
            .where(LogEvent.fingerprint == fingerprint)
            .order_by(LogEvent.timestamp.desc())
            .limit(limit)
        )
        rows = (await db.execute(stmt)).all()
        return [row[0] for row in rows]


async def _analyze_and_save(pattern: dict) -> None:
    from app.services.claude_service import analyze_logs
    from app.models.project import Project
    from app.models.user import User
    from app.config import settings
    from datetime import timedelta

    # Verifica limite insights per piano
    async with AsyncSessionLocal() as db:
        project = await db.get(Project, pattern["project_id"])
        if not project:
            return
        owner = await db.get(User, project.user_id)
        plan = owner.plan if owner else "starter"
        limit = settings.plan_insight_limits.get(plan, 5)

        if limit < 999999:
            # Conta insights del mese corrente per questo progetto
            from sqlalchemy import and_
            month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            count_stmt = select(func.count()).where(
                and_(
                    AiInsight.project_id == pattern["project_id"],
                    AiInsight.created_at >= month_start,
                )
            )
            current_count = (await db.execute(count_stmt)).scalar() or 0
            if current_count >= limit:
                logger.info("Limite insights raggiunto per piano %s (progetto %s): %d/%d", plan, pattern["project_id"], current_count, limit)
                return

    messages = await _fetch_sample_messages(pattern["fingerprint"])
    if not messages:
        return

    result = await analyze_logs(messages)

    insight = AiInsight(
        id=uuid.uuid4(),
        pattern_id=pattern["pattern_id"],
        project_id=pattern["project_id"],
        root_cause=result["root_cause"],
        suggested_fix=result["suggested_fix"],
        confidence=result["confidence"],
        created_at=datetime.now(timezone.utc),
    )
    async with AsyncSessionLocal() as db:
        db.add(insight)
        await db.commit()

    logger.info(
        "Insight salvato: fingerprint=%s service=%s occorrenze=%d confidence=%.2f",
        pattern["fingerprint"],
        pattern["service"],
        pattern["count"],
        result["confidence"],
    )


async def run() -> None:
    logger.info("AI worker avviato (polling ogni %ds, soglia %d occorrenze)", POLL_INTERVAL, MIN_OCCURRENCES)
    while True:
        try:
            patterns = await _find_unanalyzed_patterns()
            if patterns:
                logger.info("Pattern nuovi da analizzare: %d", len(patterns))
                for pattern in patterns:
                    try:
                        await _analyze_and_save(pattern)
                    except Exception:
                        logger.exception("Errore analisi pattern %s", pattern["fingerprint"])
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("AI worker crashed — riavvio tra 5s")
            await asyncio.sleep(5)
            continue

        await asyncio.sleep(POLL_INTERVAL)
