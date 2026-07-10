"""
Standalone entry point for background workers.

Previously the workers ran inside the FastAPI lifespan, which meant each
gunicorn worker process would spawn its own copy of every worker. For
workers that share a Redis consumer name (pattern_worker, alert_worker)
this caused continuous NOGROUP errors and restart loops — both workers
fighting over the same consumer registration.

This module runs the workers in a single dedicated process, independent
from the HTTP API. The api container keeps gunicorn 2-worker for HTTP
throughput; this worker container runs as a single process so each
Redis consumer name maps to exactly one connection.

Graceful shutdown: SIGTERM cancels all tasks, final flushes run via the
existing CancelledError handlers in each worker module.
"""
import asyncio
import logging
import os
import signal

# Validate critical secrets the same way main.py does — fail fast on misconfig.
if not os.getenv("JWT_SECRET_KEY"):
    raise RuntimeError("JWT_SECRET_KEY not set — cannot start worker process.")

from app.workers import (
    pattern_worker,
    ai_worker,
    alert_worker,
    retention_worker,
    anomaly_worker,
    uptime_worker,
    trial_worker,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger("workers_main")


async def main() -> None:
    logger.info("Worker process starting — 7 background workers")
    tasks = [
        asyncio.create_task(pattern_worker.run(), name="pattern_worker"),
        asyncio.create_task(ai_worker.run(), name="ai_worker"),
        asyncio.create_task(alert_worker.run(), name="alert_worker"),
        asyncio.create_task(retention_worker.run(), name="retention_worker"),
        asyncio.create_task(trial_worker.run(), name="trial_worker"),
        asyncio.create_task(anomaly_worker.run(), name="anomaly_worker"),
        asyncio.create_task(uptime_worker.uptime_worker(), name="uptime_worker"),
    ]

    # Wire SIGTERM/SIGINT → cancel everything so containers stop cleanly.
    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _request_stop(signame: str) -> None:
        logger.info("Received %s — cancelling workers", signame)
        stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _request_stop, sig.name)

    # Wait for either a worker to crash hard or a shutdown signal.
    stop_task = asyncio.create_task(stop_event.wait(), name="_stop_waiter")
    done, _pending = await asyncio.wait(
        [*tasks, stop_task], return_when=asyncio.FIRST_COMPLETED
    )

    logger.info("Shutdown sequence: cancelling %d worker tasks", len(tasks))
    for t in tasks:
        if not t.done():
            t.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info("All workers stopped cleanly")


if __name__ == "__main__":
    asyncio.run(main())
