import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()

class AuditLogOut(BaseModel):
    id: uuid.UUID
    action: str
    resource: Optional[str]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

@router.get("/audit", response_model=list[AuditLogOut])
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id == user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
