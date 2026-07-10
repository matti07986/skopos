import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
from jwt.exceptions import InvalidTokenError
import os

from app.database import get_db
from app.models.user import User
from app.models.project import Project

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"


async def get_current_user(
    request: Request,
    api_key: str = Security(api_key_header),
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    from fastapi import Request
    token = None

    # 1. Prova prima con JWT Bearer header
    if credentials:
        token = credentials.credentials
    # 2. Fallback su cookie HttpOnly
    elif request.cookies.get("access_token"):
        token = request.cookies.get("access_token")

    if token:
        try:
            from app.config import settings
            r = aioredis.from_url(settings.redis_url)
            is_blacklisted = await r.get(f"blacklist:{token}")
            await r.aclose()
            if is_blacklisted:
                raise HTTPException(status_code=401, detail="Token has been revoked")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token")
            result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
        except InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    # 3. Fallback su API key
    if api_key:
        result = await db.execute(select(User).where(User.api_key == api_key, User.is_active == True))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid API key")
        return user

    raise HTTPException(status_code=401, detail="Authentication required")


async def get_current_project(
    api_key: str = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> Project:
    result = await db.execute(select(Project).where(Project.api_key == api_key))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=401, detail="Invalid project API key")
    return project
