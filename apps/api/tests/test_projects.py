import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_list_projects_unauthenticated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/v1/projects")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_project_unauthenticated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/v1/projects", json={"name": "Test Project"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_delete_project_unauthenticated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.delete("/v1/projects/00000000-0000-0000-0000-000000000001")
    assert res.status_code == 401
