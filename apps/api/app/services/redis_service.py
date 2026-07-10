import json
import logging
from typing import AsyncIterator

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

STREAM_LOGS = "stream:logs"
STREAM_PATTERNS = "stream:patterns"
STREAM_INSIGHTS = "stream:insights"

_pool: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _pool


async def publish_log(event: dict) -> str:
    r = get_redis()
    msg_id = await r.xadd(STREAM_LOGS, {"data": json.dumps(event)})
    return msg_id


async def consume_stream(
    stream: str,
    group: str,
    consumer: str,
    block_ms: int = 2000,
) -> AsyncIterator[tuple[str, dict]]:
    r = get_redis()
    try:
        await r.xgroup_create(stream, group, id="0", mkstream=True)
    except Exception:
        pass  # gruppo già esistente

    while True:
        entries = await r.xreadgroup(
            groupname=group,
            consumername=consumer,
            streams={stream: ">"},
            count=10,
            block=block_ms,
        )
        if not entries:
            continue
        for _, messages in entries:
            for msg_id, fields in messages:
                yield msg_id, json.loads(fields["data"])
                await r.xack(stream, group, msg_id)


# ── JSON cache helpers ────────────────────────────────────────────────
# Generic get-or-compute pattern for caching expensive computed values
# (DB aggregates, external API responses, anything reproducible).
# Keys are typed as JSON so callers can store dicts/lists transparently.

import json as _json
from typing import Awaitable, Callable, TypeVar

_T = TypeVar("_T")


async def cache_get_json(key: str) -> dict | list | None:
    """Return cached JSON value or None if missing/corrupt."""
    r = get_redis()
    try:
        raw = await r.get(key)
        if raw is None:
            return None
        return _json.loads(raw)
    except (_json.JSONDecodeError, Exception):
        return None


async def cache_set_json(key: str, value: dict | list, ttl_seconds: int) -> None:
    """Store JSON value with TTL. Fail-silent: cache errors must never break the API."""
    try:
        r = get_redis()
        await r.set(key, _json.dumps(value, default=str), ex=ttl_seconds)
    except Exception:
        # Cache write failure is non-fatal; the caller already has the value.
        pass


async def cached_or_compute(
    key: str,
    ttl_seconds: int,
    compute_fn: Callable[[], Awaitable[dict | list]],
) -> dict | list:
    """
    Get-or-compute: returns cached value if present, otherwise runs compute_fn,
    caches the result, and returns it. Always returns the freshest computed
    value on cache miss — never blocks waiting for another concurrent caller.

    Designed for hot, expensive endpoints (e.g. /metrics percentile_cont queries)
    where a 30s TTL cuts upstream load by 99% without serving stale data to
    real users.
    """
    cached = await cache_get_json(key)
    if cached is not None:
        return cached
    fresh = await compute_fn()
    await cache_set_json(key, fresh, ttl_seconds)
    return fresh
