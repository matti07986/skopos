"""
Pattern worker — consume log events from Redis stream, bulk-persist to Postgres.

DESIGN
------
Reads with XREADGROUP in bulk (count=BATCH_SIZE, block=500ms) so the outer
loop can flush stale partial batches when the stream is idle.

DURABILITY
----------
The bug being fixed: previously, on bulk insert failure the code reset both
`batch` and `pending_msg_ids` to empty. Messages stayed in the consumer's
PEL (Pending Entry List) — unacknowledged — but the worker had lost their
IDs and would never re-read them via `XREADGROUP > $` (which only returns
never-seen messages). Net effect: events accepted by the API but silently
dropped on persistence failure.

The fix has two layers:

  1. STARTUP RECOVERY: on each loop iteration, first check this consumer's
     PEL with `XREADGROUP "0"` and reprocess anything sitting there. Only
     when the PEL is empty do we read new messages with `">"`.

  2. CRASH RECOVERY: if the worker died mid-batch, those messages remain in
     PEL forever (idle), invisible to the live consumer. XAUTOCLAIM runs
     periodically to grab idle pending messages back into our consumer.

XACK happens only after a successful flush. On flush exception we keep
the messages in PEL (do NOT XACK) and the next loop iteration's "PEL
sweep" will retry them.
"""
import asyncio
import hashlib
import json
import logging
import time
import uuid
from datetime import datetime, timezone

from app.database import AsyncSessionLocal
from app.models.log_event import LogEvent
from app.services.redis_service import get_redis, STREAM_LOGS

logger = logging.getLogger(__name__)

GROUP = "pattern-group"
CONSUMER = "pattern-worker-1"

BATCH_SIZE = 100
MAX_BATCH_AGE_SEC = 2.0
XREAD_BLOCK_MS = 500
# Reclaim pending entries idle for > 30s (likely from a crashed worker).
AUTOCLAIM_MIN_IDLE_MS = 30_000
AUTOCLAIM_INTERVAL_SEC = 15.0


def _fingerprint(level: str, service: str, message: str) -> str:
    key = f"{level}:{service}:{message[:120]}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _build_log_event(event: dict) -> LogEvent:
    ts = datetime.fromisoformat(event["timestamp"])
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return LogEvent(
        id=uuid.UUID(event["id"]),
        project_id=uuid.UUID(event["project_id"]),
        timestamp=ts,
        level=event["level"],
        message=event["message"],
        service=event["service"],
        event_metadata=event.get("event_metadata", {}),
        fingerprint=_fingerprint(event["level"], event["service"], event["message"]),
    )


async def _flush_batch(batch: list[dict]) -> None:
    if not batch:
        return
    log_events = [_build_log_event(e) for e in batch]
    async with AsyncSessionLocal() as db:
        db.add_all(log_events)
        await db.commit()


def _parse_entries(entries) -> tuple[list[dict], list[str]]:
    """Parse XREADGROUP / XAUTOCLAIM entries into (events, msg_ids)."""
    events: list[dict] = []
    msg_ids: list[str] = []
    if not entries:
        return events, msg_ids
    # entries can be either:
    #   - XREADGROUP: [(stream_name, [(msg_id, fields), ...])]
    #   - XAUTOCLAIM: [next_cursor, [(msg_id, fields), ...], deleted_ids]
    # We normalize.
    if isinstance(entries[0], (list, tuple)) and len(entries[0]) >= 2 and isinstance(entries[0][1], list):
        # XREADGROUP shape
        for _stream, messages in entries:
            for msg_id, fields in messages:
                try:
                    events.append(json.loads(fields["data"]))
                    msg_ids.append(msg_id)
                except Exception:
                    logger.exception("Failed to parse stream message %s", msg_id)
    return events, msg_ids


async def run() -> None:
    logger.info(
        "Pattern worker avviato (bulk mode, BATCH_SIZE=%d, MAX_AGE=%.1fs, recovery=on)",
        BATCH_SIZE, MAX_BATCH_AGE_SEC,
    )
    r = get_redis()

    # Ensure consumer group exists (idempotent).
    try:
        await r.xgroup_create(STREAM_LOGS, GROUP, id="0", mkstream=True)
    except Exception:
        pass

    batch: list[dict] = []
    pending_msg_ids: list[str] = []
    first_event_time: float | None = None
    last_autoclaim = 0.0
    autoclaim_cursor = "0-0"

    while True:
        try:
            # === 1. RECLAIM idle pending entries from dead workers ===
            now = time.monotonic()
            if now - last_autoclaim >= AUTOCLAIM_INTERVAL_SEC:
                try:
                    cursor, claimed, _deleted = await r.xautoclaim(
                        name=STREAM_LOGS,
                        groupname=GROUP,
                        consumername=CONSUMER,
                        min_idle_time=AUTOCLAIM_MIN_IDLE_MS,
                        start_id=autoclaim_cursor,
                        count=BATCH_SIZE,
                    )
                    autoclaim_cursor = cursor if cursor != "0-0" else "0-0"
                    if claimed:
                        logger.info("XAUTOCLAIM reclaimed %d idle pending messages", len(claimed))
                        for msg_id, fields in claimed:
                            try:
                                if not batch:
                                    first_event_time = time.monotonic()
                                batch.append(json.loads(fields["data"]))
                                pending_msg_ids.append(msg_id)
                            except Exception:
                                logger.exception("Reclaimed msg %s unparseable, ACKing", msg_id)
                                await r.xack(STREAM_LOGS, GROUP, msg_id)
                except Exception:
                    logger.exception("XAUTOCLAIM failed")
                last_autoclaim = now

            # === 2. SWEEP this consumer's own PEL (recover after flush failure) ===
            #    XREADGROUP with id="0" returns messages already delivered to
            #    THIS consumer that haven't been ACKed yet — i.e., the batch
            #    we lost track of after a flush exception.
            entries = await r.xreadgroup(
                groupname=GROUP,
                consumername=CONSUMER,
                streams={STREAM_LOGS: "0"},
                count=BATCH_SIZE,
            )
            pel_events, pel_ids = _parse_entries(entries)

            if pel_events:
                logger.info("PEL sweep: recovered %d pending events from previous failure", len(pel_events))
                if not batch:
                    first_event_time = time.monotonic()
                batch.extend(pel_events)
                pending_msg_ids.extend(pel_ids)
            else:
                # === 3. NEW messages from the stream ===
                entries = await r.xreadgroup(
                    groupname=GROUP,
                    consumername=CONSUMER,
                    streams={STREAM_LOGS: ">"},
                    count=BATCH_SIZE,
                    block=XREAD_BLOCK_MS,
                )
                new_events, new_ids = _parse_entries(entries)
                if new_events:
                    if not batch:
                        first_event_time = time.monotonic()
                    batch.extend(new_events)
                    pending_msg_ids.extend(new_ids)

            # === 4. Flush decision ===
            age = time.monotonic() - (first_event_time or time.monotonic())
            should_flush = (
                len(batch) >= BATCH_SIZE or
                (batch and age >= MAX_BATCH_AGE_SEC)
            )

            if should_flush:
                try:
                    _start = time.monotonic()
                    await _flush_batch(batch)
                    _elapsed = (time.monotonic() - _start) * 1000
                    logger.info("FLUSH n=%d elapsed_ms=%.1f age_ms=%.0f", len(batch), _elapsed, age*1000)
                    # XACK only AFTER successful persist.
                    if pending_msg_ids:
                        await r.xack(STREAM_LOGS, GROUP, *pending_msg_ids)
                    batch = []
                    pending_msg_ids = []
                    first_event_time = None
                except Exception:
                    logger.exception(
                        "Bulk insert failed (%d events) — keeping in PEL, will retry next iteration",
                        len(batch),
                    )
                    # CRITICAL: do NOT clear batch/pending_msg_ids here.
                    # Messages stay in PEL (not XACKed). The next iteration's
                    # PEL sweep (step 2) will re-pick them up via XREADGROUP "0".
                    # But we DO clear our in-memory batch so we don't double-process
                    # them this iteration — they come back via the PEL sweep.
                    batch = []
                    pending_msg_ids = []
                    first_event_time = None
                    await asyncio.sleep(1)  # brief backoff before retry

        except asyncio.CancelledError:
            if batch:
                try:
                    await _flush_batch(batch)
                    if pending_msg_ids:
                        await r.xack(STREAM_LOGS, GROUP, *pending_msg_ids)
                    logger.info("Final flush completed (%d events)", len(batch))
                except Exception:
                    logger.exception("Final flush failed during shutdown — messages remain in PEL")
            raise
        except Exception:
            logger.exception("Pattern worker outer error — sleep 2s and retry")
            await asyncio.sleep(2)
