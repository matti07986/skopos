"""
Centralized project access control.
Replaces scattered `Project.user_id == user.id` checks with team-aware logic.
"""
from typing import List
import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.team import TeamMember
from app.models.user import User


async def get_user_project_ids(user: User, db: AsyncSession) -> List[uuid.UUID]:
    """
    Return all project_ids the user can access:
    - projects owned (Project.user_id == user.id)
    - projects shared via team membership (TeamMember.user_id == user.id)
    """
    owned_q = await db.execute(
        select(Project.id).where(Project.user_id == user.id)
    )
    project_ids = set(owned_q.scalars().all())

    team_q = await db.execute(
        select(Project.id)
        .join(TeamMember, TeamMember.team_id == Project.team_id)
        .where(
            TeamMember.user_id == user.id,
            Project.team_id.isnot(None),
        )
    )
    project_ids.update(team_q.scalars().all())

    return list(project_ids)


async def check_project_access(
    project_id: uuid.UUID,
    user: User,
    db: AsyncSession,
    require_owner: bool = False,
) -> Project:
    """
    Verify the user has access to a specific project.

    Two access levels:
    - require_owner=False (default): owner OR team member → read access
    - require_owner=True: only owner → write access (create/update/delete)

    Raises:
        404 if project doesn't exist
        403 if user has insufficient access for the requested level
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Owner always has full access
    if project.user_id == user.id:
        return project

    # Owner-only mode: fail without checking team membership
    if require_owner:
        raise HTTPException(
            status_code=403,
            detail="Project owner permission required",
        )

    # Team membership check (read access)
    if project.team_id:
        tm = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == project.team_id,
                TeamMember.user_id == user.id,
            )
        )
        if tm.scalar_one_or_none():
            return project

    raise HTTPException(status_code=403, detail="Forbidden")
