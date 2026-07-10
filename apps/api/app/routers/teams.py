import re
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.team import Team, TeamMember, TeamInvite
from app.models.project import Project
from app.services.email_service import send_verification_email

router = APIRouter()


def make_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# ── Schemas ──────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str

class TeamOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    owner_id: uuid.UUID
    created_at: str
    model_config = {"from_attributes": True}

class MemberOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    role: str
    joined_at: str

class InviteCreate(BaseModel):
    email: EmailStr
    role: str = "member"

class InviteOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    accepted: bool
    created_at: str

class TransferOwnership(BaseModel):
    new_owner_id: uuid.UUID

class UpdateRole(BaseModel):
    role: str


# ── Helpers ──────────────────────────────────────────────────────────────────

async def get_team_or_404(team_id: uuid.UUID, db: AsyncSession) -> Team:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

async def get_member_or_403(team_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> TeamMember:
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    return member

async def require_admin(team_id: uuid.UUID, user: User, db: AsyncSession) -> TeamMember:
    member = await get_member_or_403(team_id, user.id, db)
    if member.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Admin or owner required")
    return member

async def require_owner(team: Team, user: User) -> None:
    if team.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Owner required")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/teams", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(
    body: TeamCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    slug = make_slug(body.name)
    existing = await db.execute(select(Team).where(Team.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{secrets.token_hex(3)}"

    team = Team(id=uuid.uuid4(), name=body.name, slug=slug, owner_id=user.id)
    db.add(team)
    await db.flush()

    member = TeamMember(id=uuid.uuid4(), team_id=team.id, user_id=user.id, role="owner")
    db.add(member)
    await db.commit()
    await db.refresh(team)
    return TeamOut(id=team.id, name=team.name, slug=team.slug, owner_id=team.owner_id, created_at=team.created_at.isoformat())


@router.get("/teams", response_model=list[TeamOut])
async def list_teams(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    memberships = (await db.execute(
        select(TeamMember.team_id).where(TeamMember.user_id == user.id)
    )).scalars().all()
    if not memberships:
        return []
    teams = (await db.execute(select(Team).where(Team.id.in_(memberships)))).scalars().all()
    return [TeamOut(id=t.id, name=t.name, slug=t.slug, owner_id=t.owner_id, created_at=t.created_at.isoformat()) for t in teams]


@router.get("/teams/{team_id}/members", response_model=list[MemberOut])
async def list_members(
    team_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_member_or_403(team_id, user.id, db)
    members = (await db.execute(select(TeamMember).where(TeamMember.team_id == team_id))).scalars().all()
    result = []
    for m in members:
        u = (await db.execute(select(User).where(User.id == m.user_id))).scalar_one_or_none()
        result.append(MemberOut(id=m.id, user_id=m.user_id, email=u.email if u else "unknown", role=m.role, joined_at=m.joined_at.isoformat()))
    return result


@router.post("/teams/{team_id}/invite", response_model=InviteOut, status_code=status.HTTP_201_CREATED)
async def invite_member(
    team_id: uuid.UUID,
    body: InviteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_admin(team_id, user, db)
    team = await get_team_or_404(team_id, db)

    token = secrets.token_hex(32)
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    invite = TeamInvite(
        id=uuid.uuid4(), team_id=team_id, email=body.email,
        role=body.role, token=token, invited_by=user.id,
        accepted=False, expires_at=expires,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    # Invia email invito
    invite_url = f"https://skopos.ink/team/accept?token={token}"
    try:
        import resend, os
        resend.api_key = os.getenv("RESEND_API_KEY", "")
        resend.Emails.send({
            "from": "Skopos <noreply@skopos.ink>",
            "to": [body.email],
            "subject": f"You have been invited to join {team.name} on Skopos",
            "html": f"""
            <div style="background:#000;color:#e6edf3;font-family:Inter,sans-serif;padding:40px;max-width:480px;margin:0 auto;">
              <h1 style="color:#4ade80;font-size:20px;">Team Invitation</h1>
              <p>You have been invited to join <strong>{team.name}</strong> on Skopos as <strong>{body.role}</strong>.</p>
              <a href="{invite_url}" style="display:inline-block;background:#4ade80;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;margin-top:16px;">Accept Invitation →</a>
              <p style="color:#4a5568;font-size:12px;margin-top:24px;">This invitation expires in 7 days.</p>
            </div>
            """
        })
    except Exception:
        pass

    return InviteOut(id=invite.id, email=invite.email, role=invite.role, accepted=invite.accepted, created_at=invite.created_at.isoformat())


@router.get("/teams/{team_id}/invites", response_model=list[InviteOut])
async def list_invites(
    team_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_member_or_403(team_id, user.id, db)
    invites = (await db.execute(
        select(TeamInvite)
        .where(TeamInvite.team_id == team_id, TeamInvite.accepted == False)
        .order_by(TeamInvite.created_at.desc())
    )).scalars().all()
    return [InviteOut(id=i.id, email=i.email, role=i.role, accepted=i.accepted, created_at=i.created_at.isoformat()) for i in invites]


@router.delete("/teams/{team_id}/invites/{invite_id}", status_code=204)
async def cancel_invite(
    team_id: uuid.UUID,
    invite_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_admin(team_id, user, db)
    result = await db.execute(select(TeamInvite).where(TeamInvite.id == invite_id, TeamInvite.team_id == team_id))
    invite = result.scalar_one_or_none()
    if invite:
        await db.delete(invite)
        await db.commit()


@router.get("/teams/invite/accept")
async def accept_invite(
    token: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TeamInvite).where(TeamInvite.token == token))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite token")
    if invite.accepted:
        raise HTTPException(status_code=400, detail="Invite already accepted")
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite expired")

    existing = await db.execute(
        select(TeamMember).where(TeamMember.team_id == invite.team_id, TeamMember.user_id == user.id)
    )
    if not existing.scalar_one_or_none():
        member = TeamMember(id=uuid.uuid4(), team_id=invite.team_id, user_id=user.id, role=invite.role)
        db.add(member)

    invite.accepted = True
    await db.commit()
    return {"message": "Joined team successfully", "team_id": str(invite.team_id)}


@router.patch("/teams/{team_id}/members/{member_id}/role", response_model=MemberOut)
async def update_member_role(
    team_id: uuid.UUID,
    member_id: uuid.UUID,
    body: UpdateRole,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_admin(team_id, user, db)
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id, TeamMember.team_id == team_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner role")
    if body.role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be admin or member")
    member.role = body.role
    await db.commit()
    u = (await db.execute(select(User).where(User.id == member.user_id))).scalar_one_or_none()
    return MemberOut(id=member.id, user_id=member.user_id, email=u.email if u else "unknown", role=member.role, joined_at=member.joined_at.isoformat())


@router.delete("/teams/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    team_id: uuid.UUID,
    member_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_admin(team_id, user, db)
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id, TeamMember.team_id == team_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot remove owner")
    await db.delete(member)
    await db.commit()


@router.post("/teams/{team_id}/transfer", response_model=TeamOut)
async def transfer_ownership(
    team_id: uuid.UUID,
    body: TransferOwnership,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    team = await get_team_or_404(team_id, db)
    await require_owner(team, user)

    new_owner_member = (await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == body.new_owner_id)
    )).scalar_one_or_none()
    if not new_owner_member:
        raise HTTPException(status_code=404, detail="New owner must be a team member")

    old_owner_member = (await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user.id)
    )).scalar_one_or_none()
    if old_owner_member:
        old_owner_member.role = "admin"

    new_owner_member.role = "owner"
    team.owner_id = body.new_owner_id
    await db.commit()
    return TeamOut(id=team.id, name=team.name, slug=team.slug, owner_id=team.owner_id, created_at=team.created_at.isoformat())


@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    team = await get_team_or_404(team_id, db)
    await require_owner(team, user)
    await db.execute(delete(TeamInvite).where(TeamInvite.team_id == team_id))
    await db.execute(delete(TeamMember).where(TeamMember.team_id == team_id))
    await db.delete(team)
    await db.commit()
