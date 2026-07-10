import asyncio
import logging
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.monitor import UptimeMonitor, UptimeCheck

logger = logging.getLogger(__name__)

async def check_monitor(monitor: UptimeMonitor, db: AsyncSession):
    status = "down"
    response_ms = None
    status_code = None
    error = None

    try:
        start = asyncio.get_event_loop().time()
        async with httpx.AsyncClient(timeout=monitor.timeout_seconds, follow_redirects=True) as client:
            resp = await client.request(monitor.method, monitor.url)
        elapsed = (asyncio.get_event_loop().time() - start) * 1000
        response_ms = round(elapsed, 2)
        status_code = resp.status_code

        if resp.status_code == monitor.expected_status:
            if monitor.keyword:
                status = "up" if monitor.keyword in resp.text else "down"
                if status == "down":
                    error = f"Keyword '{monitor.keyword}' not found"
            else:
                status = "up"
        else:
            error = f"Expected {monitor.expected_status}, got {resp.status_code}"

    except httpx.TimeoutException:
        error = f"Timeout after {monitor.timeout_seconds}s"
    except Exception as e:
        error = str(e)[:256]

    check = UptimeCheck(
        monitor_id=monitor.id,
        status=status,
        response_ms=response_ms,
        status_code=status_code,
        error=error,
    )
    db.add(check)

    prev_status = monitor.last_status
    monitor.last_status = status
    monitor.last_response_ms = response_ms
    monitor.last_checked_at = datetime.now(timezone.utc)
    await db.commit()

    # Manda alert se passa da up a down
    if prev_status == "up" and status == "down" and monitor.alert_destination:
        await send_alert(monitor, error or "No response", is_recovery=False)
    # Manda recovery se passa da down a up
    elif prev_status == "down" and status == "up" and monitor.alert_destination:
        await send_alert(monitor, "", is_recovery=True)


async def send_alert(monitor: UptimeMonitor, reason: str, is_recovery: bool = False):
    from app.services.email_service import send_alert_email, should_send_alert_email
    from app.database import AsyncSessionLocal
    from app.models.project import Project
    from app.models.user import User
    from sqlalchemy import select
    from datetime import datetime, timezone
    try:
        if monitor.alert_channel == "email" and monitor.alert_destination:
            # Respect owner notify_alerts preference (consistent with alert_worker/anomaly_worker)
            async with AsyncSessionLocal() as db:
                q = (
                    select(User)
                    .join(Project, Project.user_id == User.id)
                    .where(Project.id == monitor.project_id)
                )
                owner = (await db.execute(q)).scalar_one_or_none()
                if owner is not None and not should_send_alert_email(owner):
                    logger.info(
                        f"Skipping uptime alert for {monitor.name}: "
                        f"owner {owner.email} has notify_alerts disabled"
                    )
                    return
            if is_recovery:
                rule_name = f"{monitor.name} is back UP — {monitor.url}"
                level = "UP"
            else:
                rule_name = f"{monitor.name} is DOWN — {monitor.url}"
                level = "DOWN"
            await send_alert_email(
                to=monitor.alert_destination,
                rule_name=rule_name,
                level=level,
                count=1,
                triggered_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            )
            logger.info(f"Uptime {'recovery' if is_recovery else 'alert'} sent to {monitor.alert_destination} for {monitor.name}")
    except Exception as e:
        logger.error(f"Failed to send uptime alert: {e}")


async def uptime_worker():
    logger.info("Uptime worker avviato - polling ogni 10s")
    print("UPTIME WORKER STARTED", flush=True)
    # Track quando ogni monitor e' stato controllato l'ultima volta
    last_checked: dict[str, float] = {}

    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(UptimeMonitor).where(UptimeMonitor.is_active == True)
                )
                monitors = result.scalars().all()

            import time
            now = time.time()
            tasks = []
            for monitor in monitors:
                key = str(monitor.id)
                last = last_checked.get(key, 0)
                if now - last >= monitor.interval_seconds:
                    last_checked[key] = now
                    tasks.append(monitor)

            if tasks:
                async with AsyncSessionLocal() as db:
                    for monitor in tasks:
                        try:
                            await check_monitor(monitor, db)
                        except Exception as e:
                            logger.error(f"Error checking monitor {monitor.id}: {e}")

        except Exception as e:
            logger.error(f"Uptime worker error: {e}")

        await asyncio.sleep(10)
