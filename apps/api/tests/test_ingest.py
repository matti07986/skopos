import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app
from app.models.user import User


@pytest.fixture
def mock_user():
    return User(
        id="00000000-0000-0000-0000-000000000001",
        email="test@logtail.dev",
        hashed_password="x",
        api_key="test-key-123",
        plan="pro",
        is_active=True,
    )


@pytest.mark.asyncio
async def test_ingest_accepted(mock_user):
    with (
        patch("app.deps.get_current_user", return_value=mock_user),
        patch("app.routers.ingest.publish_log", new_callable=AsyncMock) as mock_pub,
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/v1/ingest",
                json=[{"level": "ERROR", "message": "boom", "service": "api"}],
                headers={"X-API-Key": "test-key-123"},
            )
        assert resp.status_code == 202
        assert resp.json()["accepted"] == 1
        assert mock_pub.call_count == 1


@pytest.mark.asyncio
async def test_ingest_empty_payload(mock_user):
    with patch("app.deps.get_current_user", return_value=mock_user):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/v1/ingest",
                json=[],
                headers={"X-API-Key": "test-key-123"},
            )
        assert resp.status_code == 400
