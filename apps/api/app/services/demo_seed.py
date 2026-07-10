"""
Demo project seeder.

Creates a 'Demo project' with realistic seed logs for new users right after
OTP email verification — so the dashboard isn't empty on first login.

~250 log events spread across the last 5 days, with skew toward the last 24h.
Mix: 70% INFO, 20% WARN, 10% ERROR. 6 service names.
"""

import logging
import random
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.log_event import LogEvent
from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)


DEMO_PROJECT_NAME = "Demo project"
DEMO_PROJECT_DESCRIPTION = (
    "Pre-populated demo project so you can explore Skopos with realistic logs. "
    "Delete it anytime."
)

# 70% INFO, 20% WARN, 10% ERROR
_LEVEL_WEIGHTS = [("INFO", 0.70), ("WARN", 0.20), ("ERROR", 0.10)]

_LOG_TEMPLATES = {
    "INFO": [
        ("api", "User logged in"),
        ("api", "Order placed successfully"),
        ("api", "Health check OK"),
        ("api", "GET /api/v1/dashboard 200 in 23ms"),
        ("auth", "JWT issued for user"),
        ("auth", "Password reset link sent"),
        ("billing", "Subscription renewed"),
        ("billing", "Invoice generated for customer"),
        ("worker", "Background job processed: send_email"),
        ("worker", "Cron tick: cleanup_expired_sessions"),
        ("db", "Connection pool initialized (size=20)"),
        ("cache", "Cache hit: user_profile:42"),
        ("cache", "Redis ping OK (1ms)"),
    ],
    "WARN": [
        ("api", "Rate limit approaching: 90% of hourly quota"),
        ("auth", "Multiple failed login attempts from same IP"),
        ("db", "Slow query detected (1.2s): SELECT * FROM orders WHERE status='pending'"),
        ("db", "Connection pool 80% utilized"),
        ("worker", "Job retry attempt 2/3: send_notification"),
        ("cache", "Cache miss rate elevated: 35% over last 5min"),
        ("billing", "Webhook signature verification took 800ms"),
        ("api", "Deprecated endpoint hit: /v1/legacy/users"),
    ],
    "ERROR": [
        ("api", "Payment failed: card declined (insufficient funds)"),
        ("api", "Webhook 500 from stripe.com after 3 retries"),
        ("auth", "Failed login attempt for user: invalid credentials"),
        ("db", "Connection timeout: PostgreSQL took >5s to respond"),
        ("db", "Deadlock detected on table 'orders', transaction rolled back"),
        ("worker", "Job failed after 3 retries: invalid payload structure"),
        ("billing", "Subscription renewal failed: payment gateway timeout"),
        ("api", "Uncaught TypeError: cannot read property 'email' of undefined"),
        ("cache", "Redis connection refused: ECONNREFUSED"),
    ],
}


async def create_demo_project_for_user(user: User, db: AsyncSession) -> Project:
    """
    Create a demo project for a freshly-verified user with 250 realistic logs.

    Best-effort: callers should wrap in try/except so a seed failure never
    blocks the user-facing OTP verification flow.

    Note: bypasses plan project limits — this is system-generated, not user-initiated.
    """
    project = Project(
        id=uuid.uuid4(),
        user_id=user.id,
        name=DEMO_PROJECT_NAME,
        slug="demo-project",
        description=DEMO_PROJECT_DESCRIPTION,
        api_key=secrets.token_hex(32),
    )
    db.add(project)
    await db.flush()  # populate project.id without commit

    now = datetime.now(timezone.utc)
    levels = [lvl for lvl, _ in _LEVEL_WEIGHTS]
    weights = [w for _, w in _LEVEL_WEIGHTS]

    SEED_COUNT = 250
    for _ in range(SEED_COUNT):
        level = random.choices(levels, weights=weights, k=1)[0]
        service, message = random.choice(_LOG_TEMPLATES[level])

        # Skewed timestamp distribution: 50% in last 24h, 30% in 1-3 days, 20% in 3-5 days
        bucket = random.choices(
            [(0, 24), (24, 72), (72, 120)],
            weights=[0.5, 0.3, 0.2],
            k=1,
        )[0]
        hours_back = random.uniform(*bucket)
        timestamp = now - timedelta(hours=hours_back)

        log_event = LogEvent(
            project_id=project.id,
            timestamp=timestamp,
            level=level,
            message=message,
            service=service,
            event_metadata={"demo": True},
        )
        db.add(log_event)

    await db.commit()
    await db.refresh(project)
    logger.info("Demo project %s created for user %s with %d logs",
                project.id, user.id, SEED_COUNT)
    return project
