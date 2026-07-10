import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.utils.public_ratelimit import check_public_ip_rate_limit
from app.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.log_event import LogEvent

router = APIRouter()


class StatusPageOut(BaseModel):
    project_name: str
    slug: str
    range: str  # 24h | 7d | 30d
    uptime: float
    total_events: int
    error_events: int
    uptime_24h: float
    uptime_7d: float
    uptime_30d: float
    total_events_24h: int
    error_events_24h: int
    status: str
    last_updated: str


class StatusToggle(BaseModel):
    enabled: bool


@router.get("/status/{slug}")
async def get_status_page(
    slug: str,
    request: Request,
    range: str = "24h",
    db: AsyncSession = Depends(get_db),
):
    await check_public_ip_rate_limit(request, bucket="status", max_per_minute=60)

    result = await db.execute(
        select(Project).where(
            Project.slug == slug,
            Project.status_page_enabled == True,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Status page not found or not enabled")

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)

    async def count_in(window):
        total = (await db.execute(
            select(func.count()).where(
                LogEvent.project_id == project.id,
                LogEvent.timestamp >= window,
            )
        )).scalar() or 0
        errors = (await db.execute(
            select(func.count()).where(
                LogEvent.project_id == project.id,
                LogEvent.timestamp >= window,
                LogEvent.level == "ERROR",
            )
        )).scalar() or 0
        uptime = round((1 - errors / max(total, 1)) * 100, 2)
        return total, errors, uptime

    total_24h, errors_24h, uptime_24h = await count_in(last_24h)
    total_7d, errors_7d, uptime_7d = await count_in(last_7d)
    total_30d, errors_30d, uptime_30d = await count_in(last_30d)

    if range == "7d":
        total, errors, uptime = total_7d, errors_7d, uptime_7d
    elif range == "30d":
        total, errors, uptime = total_30d, errors_30d, uptime_30d
    else:
        range = "24h"
        total, errors, uptime = total_24h, errors_24h, uptime_24h

    if uptime >= 99:
        status = "operational"
    elif uptime >= 90:
        status = "degraded"
    else:
        status = "outage"

    return StatusPageOut(
        project_name=project.name,
        slug=project.slug,
        range=range,
        uptime=uptime,
        total_events=total,
        error_events=errors,
        uptime_24h=uptime_24h,
        uptime_7d=uptime_7d,
        uptime_30d=uptime_30d,
        total_events_24h=total_24h,
        error_events_24h=errors_24h,
        status=status,
        last_updated=now.isoformat(),
    )


@router.post("/projects/{project_id}/status-page")
async def toggle_status_page(
    project_id: uuid.UUID,
    body: StatusToggle,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status_page_enabled = body.enabled
    await db.commit()
    return {
        "enabled": project.status_page_enabled,
        "url": f"https://skopos.ink/status/{project.slug}" if body.enabled else None,
    }
