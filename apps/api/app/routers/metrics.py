"""Project metrics endpoint: error rate, latency p95, throughput over time.

GET /v1/projects/{project_id}/metrics?range=24h

Returns 3 time series bucketed at range-appropriate granularity:
- 1h  → 5-minute buckets
- 6h  → 30-minute buckets
- 24h → 1-hour buckets
- 7d  → 6-hour buckets

Latency p95 comes from event_metadata.latency_ms when present (SDK
convention). Buckets where no log carries a numeric latency return NULL.
Throughput is event count per bucket. Error rate is errors / total in
[0, 1], NULL if bucket is empty.
"""
import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.utils.project_access import check_project_access
from app.services.redis_service import cached_or_compute

router = APIRouter()


class MetricPoint(BaseModel):
    timestamp: datetime
    value: float | None


class MetricsResponse(BaseModel):
    error_rate: list[MetricPoint]
    latency_p95: list[MetricPoint]
    throughput: list[MetricPoint]
    range: str
    bucket_size: str


RANGE_CONFIG = {
    "1h":  {"window": "1 hour",   "bucket": "5 minutes"},
    "6h":  {"window": "6 hours",  "bucket": "30 minutes"},
    "24h": {"window": "24 hours", "bucket": "1 hour"},
    "7d":  {"window": "7 days",   "bucket": "6 hours"},
}


@router.get("/projects/{project_id}/metrics", response_model=MetricsResponse)
async def get_project_metrics(
    project_id: uuid.UUID,
    range: Literal["1h", "6h", "24h", "7d"] = "24h",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_project_access(project_id, user, db)
    config = RANGE_CONFIG[range]

    # Redis-cached compute. TTL 30s: dashboard auto-refreshes every ~10s,
    # so up to 3 polls land on the cache before a fresh DB query runs.
    # Cache key includes project_id + range so each (project, range) pair
    # is cached independently. Under 1000 concurrent dashboard loads on
    # the same project+range, only 1 DB query runs every 30s.
    cache_key = f"metrics:{project_id}:{range}"
    return await cached_or_compute(
        cache_key,
        ttl_seconds=30,
        compute_fn=lambda: _compute_metrics(project_id, range, config, db),
    )


async def _compute_metrics(project_id, range, config, db) -> dict:

    sql = text(f"""
        SELECT
            date_bin(
                INTERVAL '{config['bucket']}',
                timestamp,
                TIMESTAMPTZ '2000-01-01 00:00:00+00'
            ) AS bucket,
            COUNT(*) FILTER (WHERE level = 'ERROR') AS errors,
            COUNT(*) AS total,
            percentile_cont(0.95) WITHIN GROUP (
                ORDER BY (metadata->>'latency_ms')::float
            ) FILTER (
                WHERE metadata::jsonb ? 'latency_ms'
                  AND (metadata->>'latency_ms') ~ '^[0-9]+(\\.[0-9]+)?$'
            ) AS latency_p95
        FROM log_events
        WHERE project_id = :project_id
          AND timestamp >= NOW() - INTERVAL '{config['window']}'
        GROUP BY bucket
        ORDER BY bucket;
    """)

    result = await db.execute(sql, {"project_id": str(project_id)})
    rows = result.all()

    error_rate, latency_p95, throughput = [], [], []
    for r in rows:
        total = r.total or 0
        errors = r.errors or 0
        error_rate.append(MetricPoint(
            timestamp=r.bucket,
            value=(errors / total) if total > 0 else None,
        ))
        latency_p95.append(MetricPoint(timestamp=r.bucket, value=r.latency_p95))
        throughput.append(MetricPoint(timestamp=r.bucket, value=float(total)))

    return MetricsResponse(
        error_rate=error_rate,
        latency_p95=latency_p95,
        throughput=throughput,
        range=range,
        bucket_size=config["bucket"],
    ).model_dump()
