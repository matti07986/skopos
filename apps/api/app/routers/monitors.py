import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.utils.project_access import check_project_access, get_user_project_ids
from app.models.monitor import UptimeMonitor, UptimeCheck
from app.config import settings

router = APIRouter()

PLAN_MONITOR_LIMITS = {
    "starter": 3,
    "indie":   10,
    "pro":     30,
    "business": 999,
}

PLAN_INTERVAL_LIMITS = {
    "starter": 300,
    "indie":   60,
    "pro":     30,
    "business": 10,
}


class MonitorIn(BaseModel):
    name: str
    url: str
    method: str = "GET"
    interval_seconds: int = 60
    timeout_seconds: int = 10
    expected_status: int = 200
    keyword: Optional[str] = None
    project_id: uuid.UUID
    alert_channel: Optional[str] = None
    alert_destination: Optional[str] = None

    @validator("url")
    def validate_url(cls, v):
        v = v.strip()
        if not v.startswith("http://") and not v.startswith("https://"):
            raise ValueError("URL must start with http:// or https://")
        return v

    @validator("name")
    def validate_name(cls, v):
        if len(v.strip()) == 0:
            raise ValueError("Name cannot be empty")
        return v.strip()


class MonitorOut(BaseModel):
    id: uuid.UUID
    name: str
    url: str
    method: str
    interval_seconds: int
    timeout_seconds: int
    expected_status: int
    keyword: Optional[str]
    is_active: bool
    alert_channel: Optional[str]
    alert_destination: Optional[str]
    created_at: datetime
    last_checked_at: Optional[datetime]
    last_status: Optional[str]
    last_response_ms: Optional[float]
    uptime_24h: Optional[float] = None

    model_config = {"from_attributes": True}


class CheckOut(BaseModel):
    id: uuid.UUID
    checked_at: datetime
    status: str
    response_ms: Optional[float]
    status_code: Optional[int]
    error: Optional[str]

    model_config = {"from_attributes": True}


# _check_project_access moved to app.utils.project_access


@router.get("/monitors", response_model=List[MonitorOut])
async def list_monitors(
    project_id: Optional[uuid.UUID] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_ids = await get_user_project_ids(user, db)

    query = select(UptimeMonitor).where(UptimeMonitor.project_id.in_(project_ids))
    if project_id:
        query = query.where(UptimeMonitor.project_id == project_id)

    result = await db.execute(query.order_by(UptimeMonitor.created_at.desc()))
    monitors = result.scalars().all()

    out = []
    for m in monitors:
        since = datetime.now(timezone.utc) - timedelta(hours=24)
        total_q = await db.execute(
            select(func.count()).where(UptimeCheck.monitor_id == m.id, UptimeCheck.checked_at >= since)
        )
        up_q = await db.execute(
            select(func.count()).where(UptimeCheck.monitor_id == m.id, UptimeCheck.checked_at >= since, UptimeCheck.status == "up")
        )
        total = total_q.scalar() or 0
        up = up_q.scalar() or 0
        uptime = round((up / total) * 100, 2) if total > 0 else None
        d = MonitorOut.model_validate(m)
        d.uptime_24h = uptime
        out.append(d)

    return out


@router.post("/monitors", response_model=MonitorOut, status_code=201)
async def create_monitor(
    data: MonitorIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_project_access(data.project_id, user, db, require_owner=True)

    plan = getattr(user, "plan", "starter")
    limit = PLAN_MONITOR_LIMITS.get(plan, 3)
    count_result = await db.execute(
        select(func.count()).where(UptimeMonitor.project_id == data.project_id)
    )
    count = count_result.scalar() or 0
    if count >= limit:
        raise HTTPException(status_code=403, detail=f"Monitor limit reached for {plan} plan ({limit})")

    min_interval = PLAN_INTERVAL_LIMITS.get(plan, 300)
    if data.interval_seconds < min_interval:
        raise HTTPException(status_code=403, detail=f"Minimum interval for {plan} plan is {min_interval}s")

    monitor = UptimeMonitor(**data.model_dump())
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    d = MonitorOut.model_validate(monitor)
    d.uptime_24h = None
    return d


@router.patch("/monitors/{monitor_id}", response_model=MonitorOut)
async def update_monitor(
    monitor_id: uuid.UUID,
    data: dict = __import__("fastapi").Body(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UptimeMonitor).where(UptimeMonitor.id == monitor_id))
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    await check_project_access(monitor.project_id, user, db, require_owner=True)
    for k, v in data.items():
        if hasattr(monitor, k):
            setattr(monitor, k, v)
    await db.commit()
    await db.refresh(monitor)
    d = MonitorOut.model_validate(monitor)
    d.uptime_24h = None
    return d


@router.delete("/monitors/{monitor_id}", status_code=204)
async def delete_monitor(
    monitor_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UptimeMonitor).where(UptimeMonitor.id == monitor_id))
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    await check_project_access(monitor.project_id, user, db, require_owner=True)
    await db.delete(monitor)
    await db.commit()


@router.get("/monitors/{monitor_id}/checks", response_model=List[CheckOut])
async def get_checks(
    monitor_id: uuid.UUID,
    limit: int = 100,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UptimeMonitor).where(UptimeMonitor.id == monitor_id))
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    await check_project_access(monitor.project_id, user, db)
    checks = await db.execute(
        select(UptimeCheck).where(UptimeCheck.monitor_id == monitor_id)
        .order_by(UptimeCheck.checked_at.desc()).limit(limit)
    )
    return checks.scalars().all()
