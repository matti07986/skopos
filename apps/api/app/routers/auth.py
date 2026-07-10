import logging
from typing import Optional
import asyncio
import secrets
import uuid
import os

import redis.asyncio as aioredis
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
import jwt
from pydantic import BaseModel, EmailStr, validator
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.services.audit_service import log_action
from app.models.user import User
from app.deps import get_current_user
from app.services.email_service import send_verification_email, send_welcome_email
from app.services.demo_seed import create_demo_project_for_user
from app.models.project import Project

logger = logging.getLogger(__name__)

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Hash dummy per uniformare il timing del login (evita user enumeration via timing attack)
_DUMMY_HASH = pwd_ctx.hash("_timing_protection_dummy_never_matched_")

REDIS_URL = "redis://redis:6379"
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 giorni

# Demo account: shared, read-only, exists for the "Try the live demo" CTA in pre-launch.



async def get_redis():
    r = aioredis.from_url(REDIS_URL)
    try:
        yield r
    finally:
        await r.aclose()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class RegisterResponse(BaseModel):
    user_id: uuid.UUID
    api_key: str


@router.post("/auth/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    r = aioredis.from_url(REDIS_URL)
    try:
        reg_key = f"register_attempts:{body.email}"
        reg_attempts = await r.get(reg_key)
        if reg_attempts and int(reg_attempts) >= 10:
            raise HTTPException(status_code=429, detail="Too many registration attempts. Try again in 15 minutes.")
        await r.incr(reg_key)
        await r.expire(reg_key, 900)
    finally:
        await r.aclose()

    existing = await db.execute(select(User).where(User.email == body.email))
    existing_user = existing.scalar_one_or_none()
    if existing_user and existing_user.email_verified:
        raise HTTPException(status_code=400, detail="Email already registered")

    # OTP a 6 cifre, valido 15 minuti
    token = f"{secrets.randbelow(1_000_000):06d}"
    token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)

    if existing_user and not existing_user.email_verified:
        # Utente non verificato: aggiorna con nuovi dati e nuovo OTP
        existing_user.hashed_password = await asyncio.get_event_loop().run_in_executor(None, pwd_ctx.hash, body.password[:72])
        existing_user.verification_token = token
        existing_user.verification_token_expires_at = token_expires
        existing_user.api_key = secrets.token_hex(32)
        await db.commit()
        await db.refresh(existing_user)
        user = existing_user
    else:
        user = User(
            id=uuid.uuid4(),
            email=body.email,
            hashed_password=await asyncio.get_event_loop().run_in_executor(None, pwd_ctx.hash, body.password[:72]),
            api_key=secrets.token_hex(32),
            plan="indie",
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=3),
            verification_token=token,
            verification_token_expires_at=token_expires,
            email_verified=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Invia email di verifica
    await send_verification_email(user.email, token)

    return RegisterResponse(user_id=user.id, api_key=user.api_key)


class RotateKeyResponse(BaseModel):
    api_key: str


@router.post("/auth/rotate-key", response_model=RotateKeyResponse)
async def rotate_key(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.api_key = secrets.token_hex(32)
    await db.commit()
    return RotateKeyResponse(api_key=db_user.api_key)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    api_key: str
    user_id: uuid.UUID


def _get_client_ip(request: Request) -> str:
    """Real client IP behind reverse proxy. X-Forwarded-For first hop wins."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    r = aioredis.from_url(REDIS_URL)
    try:
        email_key = f"login_attempts:email:{body.email}"
        client_ip = _get_client_ip(request)
        ip_key = f"login_attempts:ip:{client_ip}"

        # Rate limit per email: 5 fallimenti / 15 min  →  suggerisce reset password
        email_attempts = await r.get(email_key)
        if email_attempts and int(email_attempts) >= 5:
            ttl = await r.ttl(email_key)
            retry_after = max(ttl, 60) if ttl > 0 else 900
            logger.warning(f"Rate limit hit (email) for {body.email} from ip={client_ip}")
            raise HTTPException(
                status_code=429,
                detail="Too many failed attempts for this account. Try again later, or reset your password.",
                headers={"Retry-After": str(retry_after)},
            )

        # Rate limit per IP: 20 fallimenti / 5 min  →  protezione brute force
        ip_attempts = await r.get(ip_key)
        if ip_attempts and int(ip_attempts) >= 20:
            ttl = await r.ttl(ip_key)
            retry_after = max(ttl, 60) if ttl > 0 else 300
            logger.warning(f"Rate limit hit (ip) for {client_ip} attempting email={body.email}")
            raise HTTPException(
                status_code=429,
                detail="Too many failed attempts from this network. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()
        # Esegue sempre bcrypt per uniformare il timing (evita user enumeration via timing attack)
        hash_to_check = user.hashed_password if user else _DUMMY_HASH
        pwd_ok = await asyncio.get_event_loop().run_in_executor(None, pwd_ctx.verify, body.password[:72], hash_to_check)
        if not user or not pwd_ok or not user.email_verified:
            # Incrementa entrambi i contatori
            await r.incr(email_key)
            await r.expire(email_key, 900)
            await r.incr(ip_key)
            await r.expire(ip_key, 300)
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Login OK: pulisci entrambi i contatori
        await r.delete(email_key, ip_key)

        token_data = {"sub": str(user.id), "email": user.email}
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data["exp"] = expire
        access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

        # Imposta cookie HttpOnly sicuro
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )

        return LoginResponse(
            access_token=access_token,
            api_key=user.api_key,
            user_id=user.id,
        )
    finally:
        await r.aclose()


class LogoutResponse(BaseModel):
    message: str


@router.post("/auth/logout", response_model=LogoutResponse)
async def logout(request: Request, response: Response):
    authorization = request.headers.get("Authorization")
    token = None

    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    else:
        token = request.cookies.get("access_token")

    if token:
        r = aioredis.from_url(REDIS_URL)
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            exp = payload.get("exp", 0)
            ttl = max(0, exp - int(datetime.now(timezone.utc).timestamp()))
            await r.setex(f"blacklist:{token}", ttl, "1")
        except Exception:
            pass
        finally:
            await r.aclose()

    # Cancella il cookie
    response.delete_cookie(key="access_token", path="/")
    return LogoutResponse(message="Logged out successfully")


class VerifyEmailResponse(BaseModel):
    message: str
    api_key: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp: str




@router.post("/auth/demo-login")
async def demo_login_retired():
    """Demo flow retired pre-launch. Returns 410 for any cached frontend calls."""
    raise HTTPException(
        status_code=410,
        detail="The pre-launch demo has been retired. Join the waiting list to be notified at launch.",
    )



@router.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    # Normalizza OTP (rimuovi spazi)
    otp = body.otp.strip().replace(" ", "")
    if not otp.isdigit() or len(otp) != 6:
        raise HTTPException(status_code=400, detail="Codice non valido. Inserisci 6 cifre.")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email già verificata")

    # Rate limiting: max 5 tentativi in 15 min
    r = aioredis.from_url(REDIS_URL)
    try:
        attempts_key = f"otp_attempts:{user.email}"
        attempts = await r.get(attempts_key)
        if attempts and int(attempts) >= 5:
            raise HTTPException(status_code=429, detail="Troppi tentativi falliti. Richiedi un nuovo codice.")

        if user.verification_token != otp:
            await r.incr(attempts_key)
            await r.expire(attempts_key, 900)
            raise HTTPException(status_code=400, detail="Codice errato")

        if user.verification_token_expires_at and user.verification_token_expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Codice scaduto. Richiedine uno nuovo.")
    finally:
        await r.aclose()

    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    await db.commit()

    # Send welcome email (best-effort; never blocks user-facing flow)
    try:
        await send_welcome_email(user.email)
    except Exception:
        pass  # already logged in email_service

    # Create demo project with seed logs (best-effort; non-blocking)
    try:
        await create_demo_project_for_user(user, db)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Demo seed failed for %s: %s", user.email, e)

    access_token = jwt.encode(
        {
            "sub": str(user.id),
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "message": "Email verificata con successo",
        "access_token": access_token,
        "api_key": user.api_key,
        "user_id": str(user.id),
        "email": user.email,
    }


class ResendOtpRequest(BaseModel):
    email: str


@router.post("/auth/resend-otp")
async def resend_otp(body: ResendOtpRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        # Non riveliamo se l'email esiste o no
        return {"message": "Se l'email esiste, riceverai un nuovo codice"}
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email già verificata")

    # Rate limiting: max 3 resend in 5 minuti
    r = aioredis.from_url(REDIS_URL)
    try:
        resend_key = f"otp_resend:{user.email}"
        resends = await r.get(resend_key)
        if resends and int(resends) >= 3:
            raise HTTPException(status_code=429, detail="Hai richiesto troppi codici. Aspetta qualche minuto.")
        await r.incr(resend_key)
        await r.expire(resend_key, 300)
    finally:
        await r.aclose()

    # Genera nuovo OTP
    new_token = f"{secrets.randbelow(1_000_000):06d}"
    user.verification_token = new_token
    user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.commit()

    await send_verification_email(user.email, new_token)
    return {"message": "Codice rispedito"}


class MeResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    api_key: str
    plan: str
    password_changed_at: datetime | None = None
    language: str = "en"
    timezone: str = "UTC"
    notify_email: bool = True
    notify_alerts: bool = True


@router.get("/auth/me", response_model=MeResponse)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return MeResponse(
        user_id=db_user.id,
        email=db_user.email,
        api_key=db_user.api_key,
        plan=db_user.plan,
        password_changed_at=db_user.password_changed_at,
        language=db_user.language or "en",
        timezone=db_user.timezone or "UTC",
        notify_email=db_user.notify_email if db_user.notify_email is not None else True,
        notify_alerts=db_user.notify_alerts if db_user.notify_alerts is not None else True,
    )


class UpdateProfileRequest(BaseModel):
    current_password: str
    new_password: str

    @validator("new_password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class UpdateProfileResponse(BaseModel):
    message: str


@router.post("/auth/update-password", response_model=UpdateProfileResponse)
async def update_password(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    pwd_ok = await asyncio.get_event_loop().run_in_executor(
        None, pwd_ctx.verify, body.current_password[:72], db_user.hashed_password
    )
    if not pwd_ok:
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    db_user.hashed_password = await asyncio.get_event_loop().run_in_executor(
        None, pwd_ctx.hash, body.new_password[:72]
    )
    db_user.password_changed_at = datetime.now(timezone.utc)
    await db.commit()
    return UpdateProfileResponse(message="Password updated successfully")


class UpdatePreferencesRequest(BaseModel):
    language: Optional[str] = None
    timezone: Optional[str] = None
    notify_email: Optional[bool] = None
    notify_alerts: Optional[bool] = None


class UpdatePreferencesResponse(BaseModel):
    message: str


@router.post("/auth/update-preferences", response_model=UpdatePreferencesResponse)
async def update_preferences(
    body: UpdatePreferencesRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.language is not None:
        db_user.language = body.language
    if body.timezone is not None:
        db_user.timezone = body.timezone
    if body.notify_email is not None:
        db_user.notify_email = body.notify_email
    if body.notify_alerts is not None:
        db_user.notify_alerts = body.notify_alerts

    await db.commit()
    return UpdatePreferencesResponse(message="Preferences updated successfully")


@router.delete("/auth/delete-account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.project import Project
    from app.models.log_event import LogEvent, AiInsight
    from app.models.alert import AlertRule, AlertEvent
    from app.models.monitor import UptimeMonitor, UptimeCheck
    from app.models.team import Team, TeamMember, TeamInvite
    from app.models.audit_log import AuditLog
    from app.models.chat_usage import ChatUsage
    from sqlalchemy import delete

    # Prendi i project_id dell'utente
    project_ids = (await db.execute(
        select(Project.id).where(Project.user_id == user.id)
    )).scalars().all()

    if project_ids:
        # Alert events e rules
        rule_ids = (await db.execute(
            select(AlertRule.id).where(AlertRule.project_id.in_(project_ids))
        )).scalars().all()
        if rule_ids:
            await db.execute(delete(AlertEvent).where(AlertEvent.rule_id.in_(rule_ids)))
        await db.execute(delete(AlertRule).where(AlertRule.project_id.in_(project_ids)))

        # Uptime monitors e checks
        monitor_ids = (await db.execute(
            select(UptimeMonitor.id).where(UptimeMonitor.project_id.in_(project_ids))
        )).scalars().all()
        if monitor_ids:
            await db.execute(delete(UptimeCheck).where(UptimeCheck.monitor_id.in_(monitor_ids)))
        await db.execute(delete(UptimeMonitor).where(UptimeMonitor.project_id.in_(project_ids)))

        # Log, insight, chat usage per progetto
        await db.execute(delete(AiInsight).where(AiInsight.project_id.in_(project_ids)))
        await db.execute(delete(LogEvent).where(LogEvent.project_id.in_(project_ids)))
        await db.execute(delete(ChatUsage).where(ChatUsage.project_id.in_(project_ids)))

        await db.execute(delete(Project).where(Project.user_id == user.id))

    # Team di cui l'utente e' owner: elimina members, inviti e team
    owned_team_ids = (await db.execute(
        select(Team.id).where(Team.owner_id == user.id)
    )).scalars().all()
    if owned_team_ids:
        await db.execute(delete(TeamInvite).where(TeamInvite.team_id.in_(owned_team_ids)))
        await db.execute(delete(TeamMember).where(TeamMember.team_id.in_(owned_team_ids)))
        await db.execute(delete(Team).where(Team.owner_id == user.id))

    # Rimuovi l'utente da team altrui e inviti mandati
    await db.execute(delete(TeamMember).where(TeamMember.user_id == user.id))
    await db.execute(delete(TeamInvite).where(TeamInvite.invited_by == user.id))

    # Audit logs e chat usage per user_id
    await db.execute(delete(AuditLog).where(AuditLog.user_id == user.id))
    await db.execute(delete(ChatUsage).where(ChatUsage.user_id == user.id))

    await db.delete(user)
    await db.commit()


import hashlib
from app.models.password_reset import PasswordResetToken
from app.services.email_service import send_password_reset_email

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://skopos.ink")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @validator("new_password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


@router.post("/auth/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    r: aioredis.Redis = Depends(get_redis),
):
    rate_key = f"forgot_password:{body.email}"
    attempts = await r.get(rate_key)
    if attempts and int(attempts) >= 5:
        return {"detail": "If that email exists, a reset link has been sent."}
    await r.incr(rate_key)
    await r.expire(rate_key, 900)

    result = await db.execute(
        select(User).where(User.email == body.email, User.email_verified == True)
    )
    user = result.scalar_one_or_none()

    if user:
        plain_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(plain_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        old_tokens = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at.is_(None),
            )
        )
        for old in old_tokens.scalars().all():
            await db.delete(old)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(reset_token)
        await db.commit()

        reset_link = f"{FRONTEND_URL}/reset-password?token={plain_token}"
        await send_password_reset_email(user.email, reset_link)

    return {"detail": "If that email exists, a reset link has been sent."}


@router.post("/auth/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    user_result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    user.hashed_password = pwd_ctx.hash(body.new_password)
    user.password_changed_at = now
    reset_token.used_at = now

    other_tokens = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.id != reset_token.id,
        )
    )
    for t in other_tokens.scalars().all():
        await db.delete(t)

    await db.commit()

    # Clear login rate limits since the user just proved email ownership
    # via the reset link and set a new password. Otherwise the prior failed
    # attempts (which likely caused them to need a reset) keep them locked out.
    try:
        r = aioredis.from_url(REDIS_URL)
        try:
            # Delete both new naming and legacy naming for backwards compat
            await r.delete(
                f"login_attempts:email:{user.email}",
                f"login_attempts:{user.email}",
            )
        finally:
            await r.aclose()
    except Exception as e:
        logger.warning(f"Failed to clear rate limit after reset for {user.email}: {e}")

    return {"detail": "Password updated successfully."}
