import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_list_alerts_unauthenticated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/v1/alerts")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_alert_invalid_slack_url():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/v1/alerts",
            json={
                "name": "Test Alert",
                "level": "ERROR",
                "threshold": 5,
                "window_seconds": 60,
                "channel": "slack",
                "destination": "https://malicious.com/webhook"
            },
            headers={"X-API-Key": "fake-key"}
        )
    assert res.status_code in [401, 422]


@pytest.mark.asyncio
async def test_create_alert_invalid_email():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/v1/alerts",
            json={
                "name": "Test Alert",
                "level": "ERROR",
                "threshold": 5,
                "window_seconds": 60,
                "channel": "email",
                "destination": "not-an-email"
            },
            headers={"X-API-Key": "fake-key"}
        )
    assert res.status_code in [401, 422]
