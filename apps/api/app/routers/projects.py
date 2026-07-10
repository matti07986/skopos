import re
import uuid
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.services.audit_service import log_action
from app.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.utils.project_access import check_project_access, get_user_project_ids
from app.config import settings

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    description: str = ""


class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    api_key: str
    created_at: str

    model_config = {"from_attributes": True}


def make_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@router.get("/projects", response_model=list[ProjectOut])
async def list_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_ids = await get_user_project_ids(user, db)
    result = await db.execute(
        select(Project).where(Project.id.in_(project_ids)).order_by(Project.created_at)
    )
    projects = result.scalars().all()
    return [
        ProjectOut(
            id=p.id,
            name=p.name,
            slug=p.slug,
            description=p.description,
            api_key=p.api_key,
            created_at=p.created_at.isoformat(),
        )
        for p in projects
    ]


@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    slug = make_slug(body.name)
    existing = await db.execute(
        select(Project).where(Project.user_id == user.id, Project.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Project with this name already exists")

    # Check limite progetti per piano
    count_result = await db.execute(
        select(Project).where(Project.user_id == user.id)
    )
    current_count = len(count_result.scalars().all())
    plan = user.plan if user.plan else "starter"
    max_projects = settings.plan_project_limits.get(plan, 1)
    if current_count >= max_projects:
        raise HTTPException(
            status_code=403,
            detail=f"Project limit reached for your plan ({max_projects} project{'s' if max_projects != 1 else ''}). Upgrade to create more."
        )

    project = Project(
        id=uuid.uuid4(),
        user_id=user.id,
        name=body.name,
        slug=slug,
        description=body.description,
        api_key=secrets.token_hex(32),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectOut(
        id=project.id,
        name=project.name,
        slug=project.slug,
        description=project.description,
        api_key=project.api_key,
        created_at=project.created_at.isoformat(),
    )


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await check_project_access(project_id, user, db)
    if project.user_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can delete it")
    await db.delete(project)
    await db.commit()
