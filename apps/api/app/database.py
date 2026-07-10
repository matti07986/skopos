from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Converti URL postgres → postgresql+asyncpg
_db_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")

# Connection pool tuned for production load (CPX21 + Postgres max_connections=100).
# pool_size=20: steady-state workers (≈4× the 8 background workers + ≈12 for HTTP requests).
# max_overflow=30: burst headroom for traffic spikes — total 50 concurrent connections.
# pool_timeout=15: requests wait at most 15s for a free conn before failing fast
#                 (preferable to indefinite hangs that pile up under load).
# pool_recycle=1800: recycle every 30 min to dodge stale conns / Postgres timeouts.
# pool_pre_ping: cheap SELECT 1 before checkout to avoid handing out dead conns.
engine = create_async_engine(
    _db_url,
    echo=False,
    pool_size=15,
    max_overflow=25,
    pool_timeout=15,
    pool_recycle=1800,
    pool_pre_ping=True,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """
    Per-request DB session dependency.

    SQLAlchemy's async session opens an implicit transaction on first query
    (even read-only SELECTs, on PostgreSQL). Without an explicit commit or
    rollback, the connection returns to the pool in 'idle in transaction'
    state — under load this exhausts the pool in seconds (k6 reproduced at
    ~500 VU on 2026-06-24).

    Pattern: yield → commit on success, rollback on any raised exception.
    Routers that issue their own commit() see this final commit as a no-op.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

