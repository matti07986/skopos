"""Trial worker: downgrade users whose 3-day trial expired without a paid subscription.

Polls every hour. For each user where:
  - trial_ends_at IS NOT NULL
  - trial_ends_at < NOW
  - lemon_subscription_id IS NULL  (never paid via LS)
  - plan != 'starter'              (still on the trial plan)

→ sets plan='starter' and clears trial_ends_at (one-shot, won't re-process).

Users who paid during or after the trial keep their plan because their
lemon_subscription_id is set by the LS webhook on subscription_created.

Pre-existing users (signed up before this feature shipped) have
trial_ends_at NULL by migration and are ignored.
"""
import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)

POLL_INTERVAL = 60 * 60  # ogni ora


async def _downgrade_expired_trials() -> None:
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        stmt = select(User).where(
            User.trial_ends_at.isnot(None),
            User.trial_ends_at < now,
            User.lemon_subscription_id.is_(None),
            User.plan != "starter",
        )
        result = await db.execute(stmt)
        users = result.scalars().all()

        if not users:
            return

        for user in users:
            logger.info(
                "Trial worker: downgrade user_id=%s email=%s plan=%s -> starter (trial_ended_at=%s)",
                user.id, user.email, user.plan, user.trial_ends_at,
            )
            user.plan = "starter"
            user.trial_ends_at = None

        await db.commit()
        logger.info("Trial worker: downgraded %d expired trial(s)", len(users))


async def run() -> None:
    logger.info("Trial worker avviato (polling ogni %dh)", POLL_INTERVAL // 3600)
    while True:
        try:
            await _downgrade_expired_trials()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Trial worker crashed — riavvio tra 60s")
            await asyncio.sleep(60)
            continue
        await asyncio.sleep(POLL_INTERVAL)
