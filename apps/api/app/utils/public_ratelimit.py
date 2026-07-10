"""
IP-based rate limiting for public (no-auth) endpoints.

Counters live in Redis with a 70s TTL window (slightly wider than the 60s
bucket to avoid edge skips). The client IP is taken from X-Forwarded-For
(nginx is in front of FastAPI), falling back to request.client.host.
"""
import time

from fastapi import HTTPException, Request

from app.services.redis_service import get_redis


def _get_client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


async def check_public_ip_rate_limit(
    request: Request,
    *,
    bucket: str,
    max_per_minute: int = 60,
) -> None:
    """
    Enforce a per-IP rate limit on a named bucket.
    Raises HTTP 429 if the limit is exceeded.

    Usage:
        await check_public_ip_rate_limit(request, bucket="share", max_per_minute=60)
    """
    r = get_redis()
    ip = _get_client_ip(request)
    now_min = int(time.time() // 60)
    key = f"public_ratelimit:{bucket}:{ip}:{now_min}"

    current = await r.incr(key)
    if current == 1:
        await r.expire(key, 70)
    if current > max_per_minute:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Limit: {max_per_minute}/min per IP.",
        )
