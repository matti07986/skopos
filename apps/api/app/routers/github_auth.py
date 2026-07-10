from datetime import datetime, timedelta, timezone
import uuid
import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.config import settings
import jwt
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

def create_access_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

router = APIRouter()

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAIL_URL = "https://api.github.com/user/emails"

FRONTEND_URL = "https://skopos.ink"


@router.get("/auth/github")
async def github_login():
    state = secrets.token_hex(16)
    url = (
        f"{GITHUB_AUTH_URL}"
        f"?client_id={settings.github_client_id}"
        f"&scope=user:email"
        f"&state={state}"
    )
    # Salva state in cookie HttpOnly per verifica CSRF al callback
    response = RedirectResponse(url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600,
        path="/",
    )
    return response


@router.get("/auth/github/callback")
async def github_callback(request: Request, code: str, state: str = "", db: AsyncSession = Depends(get_db)):
    # Verifica CSRF: confronta state ricevuto con quello salvato nel cookie
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    # Scambia code per access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GITHUB_TOKEN_URL,
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="GitHub OAuth failed")

    # Recupera dati utente
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        github_user = user_resp.json()

        # Recupera email primaria
        email_resp = await client.get(
            GITHUB_EMAIL_URL,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        emails = email_resp.json()

    # Trova email primaria verificata
    primary_email = None
    if isinstance(emails, list):
        for e in emails:
            if e.get("primary") and e.get("verified"):
                primary_email = e.get("email")
                break
    if not primary_email:
        primary_email = github_user.get("email")
    if not primary_email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")

    # Trova o crea utente
    result = await db.execute(select(User).where(User.email == primary_email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=primary_email,
            hashed_password="",
            api_key=secrets.token_hex(32),
            plan="indie",
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=3),
            email_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif not user.email_verified:
        user.email_verified = True
        await db.commit()

    # Genera JWT
    jwt_token = create_access_token({"sub": str(user.id)})

    # Redirect al frontend con token, pulisce il cookie oauth_state
    response = RedirectResponse(f"{FRONTEND_URL}/login?token={jwt_token}")
    response.delete_cookie("oauth_state")
    return response
