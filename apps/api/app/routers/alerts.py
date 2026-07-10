import re
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.services.audit_service import log_action
from app.deps import get_current_user
from app.models.user import User
from app.models.alert import AlertRule
from app.models.project import Project
from app.utils.project_access import check_project_access, get_user_project_ids
from app.config import settings

router = APIRouter()


class AlertRuleIn(BaseModel):
    name: str
    level: Literal["ERROR", "WARN", "INFO", "DEBUG"] = "ERROR"
    threshold: int = 1
    window_seconds: int = 60
    channel: Literal["slack", "email", "webhook"] = "slack"
    destination: str
    project_id: Optional[uuid.UUID] = None

    @validator("destination")
    def validate_destination(cls, v, values):
        channel = values.get("channel")
        if channel == "slack":
            if not v.startswith("https://hooks.slack.com/"):
                raise ValueError("Slack destination must be a valid Slack webhook URL")
        elif channel == "email":
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
                raise ValueError("Email destination must be a valid email address")
        elif channel == "webhook":
            if not v.startswith("https://"):
                raise ValueError("Webhook destination must be a valid HTTPS URL")
        return v

    @validator("name")
    def validate_name(cls, v):
        if len(v) > 100:
            raise ValueError("Name too long (max 100 characters)")
        return v

    @validator("threshold")
    def validate_threshold(cls, v):
        if v < 1 or v > 10000:
            raise ValueError("Threshold must be between 1 and 10000")
        return v

    @validator("window_seconds")
    def validate_window(cls, v):
        if v < 10 or v > 86400:
            raise ValueError("Window must be between 10 and 86400 seconds")
        return v


class AlertRuleOut(BaseModel):
    id: uuid.UUID
    name: str
    level: str
    threshold: int
    window_seconds: int
    channel: str
    destination: str
    is_active: bool
    webhook_secret: Optional[str] = None

    model_config = {"from_attributes": True}


@router.get("/alerts", response_model=list[AlertRuleOut])
async def list_alerts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_ids = await get_user_project_ids(user, db)
    if not project_ids:
        return []
    result = await db.execute(
        select(AlertRule).where(AlertRule.project_id.in_(project_ids))
    )
    return result.scalars().all()


@router.post("/alerts", response_model=AlertRuleOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    body: AlertRuleIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get owned projects only (for plan limit count and fallback)
    owned_q = await db.execute(select(Project.id).where(Project.user_id == user.id))
    owned_ids = owned_q.scalars().all()
    if not owned_ids:
        raise HTTPException(status_code=400, detail="Create a project first")

    # Resolve target project_id (require owner if explicit, fall back to first owned)
    if body.project_id:
        await check_project_access(body.project_id, user, db, require_owner=True)
        project_id = body.project_id
    else:
        project_id = owned_ids[0]

    # Plan limit counts rules across owned projects (the owner pays)
    current_rules = (await db.execute(
        select(AlertRule).where(AlertRule.project_id.in_(owned_ids))
    )).scalars().all()
    plan = user.plan if user.plan else "starter"
    max_alerts = settings.plan_alert_limits.get(plan, 0)
    if len(current_rules) >= max_alerts:
        raise HTTPException(
            status_code=403,
            detail=f"Alert rule limit reached for your plan ({max_alerts} rules). Upgrade to create more."
        )

    import secrets as _secrets
    webhook_secret = _secrets.token_hex(32) if body.channel == "webhook" else None
    rule = AlertRule(
        project_id=project_id,
        name=body.name,
        level=body.level,
        threshold=body.threshold,
        window_seconds=body.window_seconds,
        channel=body.channel,
        destination=body.destination,
        webhook_secret=webhook_secret,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.patch("/alerts/{alert_id}/toggle", response_model=AlertRuleOut)
async def toggle_alert(
    alert_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AlertRule).where(AlertRule.id == alert_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    await check_project_access(rule.project_id, user, db, require_owner=True)
    rule.is_active = not rule.is_active
    await db.commit()
    return rule


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AlertRule).where(AlertRule.id == alert_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    await check_project_access(rule.project_id, user, db, require_owner=True)
    await db.delete(rule)
    await db.commit()
