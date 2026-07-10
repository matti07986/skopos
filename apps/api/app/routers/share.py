import uuid
import secrets
from datetime import datetime, timedelta, timezone

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
from sqlalchemy import text

router = APIRouter()


class ShareOut(BaseModel):
    project_name: str
    uptime_24h: float
    uptime_7d: float
    total_events_24h: int
    error_count_24h: int
    warn_count_24h: int
    info_count_24h: int
    status: str
    generated_at: str


class ShareTokenOut(BaseModel):
    share_token: str
    share_url: str


@router.get("/share/{token}", response_model=ShareOut)
async def get_shared_dashboard(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await check_public_ip_rate_limit(request, bucket="share", max_per_minute=60)

    # Trova progetto per share_token
    result = await db.execute(
        select(Project).where(Project.share_token == token)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Shared dashboard not found")

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    # Solo metriche aggregate — NESSUN log, messaggio o dato utente
    total_24h = (await db.execute(
        select(func.count()).where(
            LogEvent.project_id == project.id,
            LogEvent.timestamp >= last_24h,
        )
    )).scalar() or 0

    errors_24h = (await db.execute(
        select(func.count()).where(
            LogEvent.project_id == project.id,
            LogEvent.timestamp >= last_24h,
            LogEvent.level == "ERROR",
        )
    )).scalar() or 0

    warn_24h = (await db.execute(
        select(func.count()).where(
            LogEvent.project_id == project.id,
            LogEvent.timestamp >= last_24h,
            LogEvent.level == "WARN",
        )
    )).scalar() or 0

    info_24h = (await db.execute(
        select(func.count()).where(
            LogEvent.project_id == project.id,
            LogEvent.timestamp >= last_24h,
            LogEvent.level == "INFO",
        )
    )).scalar() or 0

    total_7d = (await db.execute(
        select(func.count()).where(
            LogEvent.project_id == project.id,
            LogEvent.timestamp >= last_7d,
        )
    )).scalar() or 0

    errors_7d = (await db.execute(
        select(func.count()).where(
            LogEvent.project_id == project.id,
            LogEvent.timestamp >= last_7d,
            LogEvent.level == "ERROR",
        )
    )).scalar() or 0

    uptime_24h = round((1 - errors_24h / max(total_24h, 1)) * 100, 2)
    uptime_7d = round((1 - errors_7d / max(total_7d, 1)) * 100, 2)

    if uptime_24h >= 99:
        status = "operational"
    elif uptime_24h >= 90:
        status = "degraded"
    else:
        status = "outage"

    # Restituisce SOLO metriche — nessun log, nessun messaggio, nessun dato utente
    return ShareOut(
        project_name=project.name,
        uptime_24h=uptime_24h,
        uptime_7d=uptime_7d,
        total_events_24h=total_24h,
        error_count_24h=errors_24h,
        warn_count_24h=warn_24h,
        info_count_24h=info_24h,
        status=status,
        generated_at=now.isoformat(),
    )


@router.get("/share/{token}/hourly")
async def get_shared_hourly(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await check_public_ip_rate_limit(request, bucket="share", max_per_minute=60)

    result = await db.execute(
        select(Project).where(Project.share_token == token)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Not found")

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)

    rows = (await db.execute(
        text("""
            SELECT
                date_trunc('hour', timestamp) as hour,
                level,
                COUNT(*) as cnt
            FROM log_events
            WHERE project_id = :pid
              AND timestamp >= :since
            GROUP BY date_trunc('hour', timestamp), level
            ORDER BY hour
        """),
        {"pid": str(project.id), "since": last_24h}
    )).fetchall()

    # Costruisci struttura oraria
    hours = {}
    for i in range(24):
        h = (last_24h + timedelta(hours=i+1)).replace(minute=0, second=0, microsecond=0)
        key = h.strftime("%H:%M")
        hours[key] = {"time": key, "errors": 0, "warnings": 0, "info": 0, "debug": 0}

    for row in rows:
        key = row.hour.strftime("%H:%M")
        if key in hours:
            level = row.level
            if level == "ERROR": hours[key]["errors"] += row.cnt
            elif level == "WARN": hours[key]["warnings"] += row.cnt
            elif level == "INFO": hours[key]["info"] += row.cnt
            elif level == "DEBUG": hours[key]["debug"] += row.cnt

    return list(hours.values())


@router.get("/share/{token}/minutely")
async def get_shared_minutely(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await check_public_ip_rate_limit(request, bucket="share", max_per_minute=60)

    result = await db.execute(
        select(Project).where(Project.share_token == token)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Not found")

    # Controlla piano owner
    owner_result = await db.execute(
        select(Project.user_id).where(Project.id == project.id)
    )
    from app.models.user import User
    owner = (await db.execute(
        select(User).where(User.id == project.user_id)
    )).scalar_one_or_none()

    if not owner or owner.plan not in ("indie", "pro", "business"):
        raise HTTPException(status_code=403, detail="Available on Indie plan and above")

    now = datetime.now(timezone.utc)
    last_1h = now - timedelta(hours=1)

    rows = (await db.execute(
        text("""
            SELECT
                date_trunc('minute', timestamp) as minute,
                level,
                COUNT(*) as cnt
            FROM log_events
            WHERE project_id = :pid
              AND timestamp >= :since
            GROUP BY date_trunc('minute', timestamp), level
            ORDER BY minute
        """),
        {"pid": str(project.id), "since": last_1h}
    )).fetchall()

    minutes = {}
    for i in range(60):
        m = (last_1h + timedelta(minutes=i+1)).replace(second=0, microsecond=0)
        key = m.strftime("%H:%M")
        minutes[key] = {"time": key, "errors": 0, "warnings": 0, "info": 0}

    for row in rows:
        key = row.minute.strftime("%H:%M")
        if key in minutes:
            level = row.level
            if level == "ERROR": minutes[key]["errors"] += row.cnt
            elif level == "WARN": minutes[key]["warnings"] += row.cnt
            elif level == "INFO": minutes[key]["info"] += row.cnt

    return list(minutes.values())


@router.post("/projects/{project_id}/share", response_model=ShareTokenOut)
async def generate_share_token(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Genera nuovo token sicuro
    project.share_token = secrets.token_hex(32)
    await db.commit()

    return ShareTokenOut(
        share_token=project.share_token,
        share_url=f"https://skopos.ink/share/{project.share_token}",
    )


@router.delete("/projects/{project_id}/share", status_code=204)
async def revoke_share_token(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.share_token = None
    await db.commit()
