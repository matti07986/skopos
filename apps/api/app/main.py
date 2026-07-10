import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.routers import ingest, logs, auth, alerts, projects, teams, status, share, monitors, ai, chat, github_auth, audit, webhooks, preregister, metrics
from app.models import team  # noqa: F401 — ensure models are registered
from app.models import monitor  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate critical secrets at startup. Background workers now run in
    # a separate container (worker_main.py) so this lifespan only handles
    # HTTP startup/shutdown. See workers_main.py for the worker process.
    import os
    if not os.getenv("JWT_SECRET_KEY"):
        raise RuntimeError("JWT_SECRET_KEY non impostata — impossibile avviare l'applicazione.")
    yield


app = FastAPI(
    title="Logtail API",
    description="Log analysis SaaS with AI-powered root cause analysis",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") == "development" else None,
)

# CORS gestito da nginx

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(auth.router, prefix="/v1", tags=["auth"])
app.include_router(ingest.router, prefix="/v1", tags=["ingest"])
app.include_router(logs.router, prefix="/v1", tags=["logs"])
app.include_router(alerts.router, prefix="/v1", tags=["alerts"])
app.include_router(projects.router, prefix="/v1", tags=["projects"])
app.include_router(metrics.router, prefix="/v1", tags=["metrics"])
app.include_router(teams.router, prefix="/v1", tags=["teams"])
app.include_router(status.router, prefix="/v1", tags=["status"])
app.include_router(share.router, prefix="/v1", tags=["share"])
app.include_router(monitors.router, prefix="/v1", tags=["monitors"])
app.include_router(github_auth.router, prefix="/v1", tags=["auth"])
app.include_router(audit.router, prefix="/v1", tags=["audit"])
app.include_router(webhooks.router, prefix="/v1", tags=["webhooks"])
app.include_router(preregister.router, prefix="/v1")
app.include_router(ai.router, prefix="/v1", tags=["ai"])
app.include_router(chat.router, prefix="/v1", tags=["chat"])


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}