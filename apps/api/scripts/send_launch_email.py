"""Send the launch email to every preregistered user that hasn't been notified yet.

Usage (inside the api container):
    docker compose -f infra/docker-compose.yml exec api python scripts/send_launch_email.py

Dry-run flags:
    --dry-run                 list recipients but don't actually send
    --only-email me@x.com     send to that single address only (testing)
    --limit N                 cap to N sends (testing)

Behavior:
    - Selects preregistration_emails WHERE notified_at IS NULL, oldest first.
    - For each: sends via Resend (send_launch_email), then on success sets
      notified_at = NOW(). On failure the row stays NULL and the script
      logs the error — next run will retry.
    - Sleeps 0.2s between sends to be polite with Resend rate limits.

Idempotent: re-running after a partial failure only sends to rows still
NULL. Safe to invoke twice if the first run died mid-way.
"""
import argparse
import asyncio
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure /app is on PYTHONPATH so `from app...` works when the script is run
# directly as `python scripts/send_launch_email.py` rather than `python -m`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.preregistration_email import PreregistrationEmail
from app.services.email_service import send_launch_email

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("send_launch_email")


async def run(dry_run: bool, only_email: str | None, limit: int | None) -> int:
    """Returns process exit code: 0 if all sent (or dry-run), 1 if any failure."""
    failures: list[str] = []
    sent = 0

    async with AsyncSessionLocal() as db:
        stmt = select(PreregistrationEmail).where(
            PreregistrationEmail.notified_at.is_(None)
        ).order_by(PreregistrationEmail.created_at.asc())
        if only_email:
            stmt = stmt.where(PreregistrationEmail.email == only_email)
        if limit:
            stmt = stmt.limit(limit)

        rows = (await db.execute(stmt)).scalars().all()

        logger.info("Found %d preregistered recipient(s) without notified_at", len(rows))
        if not rows:
            return 0

        if dry_run:
            for r in rows:
                logger.info("  [DRY-RUN] would send to: %s (name=%s, created=%s)", r.email, r.name or "-", r.created_at)
            logger.info("Dry-run complete. %d would-be sends.", len(rows))
            return 0

        for r in rows:
            ok = await send_launch_email(r.email, r.name)
            if ok:
                r.notified_at = datetime.now(timezone.utc)
                sent += 1
                logger.info("  ✓ sent to %s", r.email)
            else:
                failures.append(r.email)
                logger.warning("  ✗ FAILED %s — will retry on next run", r.email)

            # Commit per row so a crash later doesn't lose the work done
            await db.commit()

            await asyncio.sleep(0.2)  # polite with Resend rate limits

    logger.info("─" * 60)
    logger.info("Sent: %d / %d. Failures: %d", sent, sent + len(failures), len(failures))
    if failures:
        logger.info("Failed emails (will retry on next run):")
        for f in failures:
            logger.info("  - %s", f)
        return 1
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="List recipients but don't send")
    parser.add_argument("--only-email", type=str, default=None, help="Send only to this address (testing)")
    parser.add_argument("--limit", type=int, default=None, help="Cap the number of sends (testing)")
    args = parser.parse_args()

    exit_code = asyncio.run(run(args.dry_run, args.only_email, args.limit))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
