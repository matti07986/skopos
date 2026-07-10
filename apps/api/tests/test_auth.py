import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_register_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/v1/auth/register", json={
            "email": "test_new@example.com",
            "password": "TestPass123"
        })
    assert res.status_code == 201
    assert "api_key" in res.json()
    assert "user_id" in res.json()


@pytest.mark.asyncio
async def test_register_weak_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/v1/auth/register", json={
            "email": "test2@example.com",
            "password": "weak"
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_register_duplicate_email():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/v1/auth/register", json={
            "email": "duplicate@example.com",
            "password": "TestPass123"
        })
        res = await ac.post("/v1/auth/register", json={
            "email": "duplicate@example.com",
            "password": "TestPass123"
        })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_login_unverified_email():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/v1/auth/register", json={
            "email": "unverified@example.com",
            "password": "TestPass123"
        })
        res = await ac.post("/v1/auth/login", json={
            "email": "unverified@example.com",
            "password": "TestPass123"
        })
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_login_wrong_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/v1/auth/login", json={
            "email": "test@example.com",
            "password": "WrongPass123"
        })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_rotate_key_unauthenticated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/v1/auth/rotate-key")
    assert res.status_code == 401
