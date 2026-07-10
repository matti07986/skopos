"""
Shared helper to convert log event fingerprints into AiInsight pattern_ids.

Previously duplicated between routers/chat.py and routers/logs.py. The mapping
fingerprint → pattern_id uses uuid5 with a fixed namespace, matching the
algorithm used in ai_worker, so the same fingerprint always maps to the same
pattern_id across the system.
"""
import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.log_event import LogEvent

# Must match the namespace used in ai_worker; do not change without a backfill.
_PATTERN_NAMESPACE = uuid.UUID("b3e2a1c0-dead-beef-cafe-000000000000")


async def get_pattern_ids_for_projects(
    project_ids: List[uuid.UUID],
    db: AsyncSession,
) -> List[uuid.UUID]:
    """
    Return all AiInsight pattern_ids derived from log fingerprints across the
    given project IDs. Returns an empty list if no projects or no fingerprints.
    """
    if not project_ids:
        return []
    fingerprints = (await db.execute(
        select(LogEvent.fingerprint)
        .where(LogEvent.project_id.in_(project_ids))
        .where(LogEvent.fingerprint.is_not(None))
        .distinct()
    )).scalars().all()
    return [uuid.uuid5(_PATTERN_NAMESPACE, fp) for fp in fingerprints]
