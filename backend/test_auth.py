import os

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_register_and_login_flow():
    email = "auth-user@example.com"
    password = "StrongPass!123"

    register = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": "Auth User"},
    )
    assert register.status_code == 200, register.text
    data = register.json()
    assert data["user"]["email"] == email
    assert "access_token" in data

    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    assert token

    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200, me.text
    assert me.json()["email"] == email


def test_duplicate_user_is_rejected():
    email = "duplicate-user@example.com"
    password = "StrongPass!123"

    first = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": "First User"},
    )
    assert first.status_code == 200, first.text

    second = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": "Second User"},
    )
    assert second.status_code == 409, second.text


def test_invalid_password_is_rejected():
    resp = client.post(
        "/api/auth/register",
        json={"email": "weak@example.com", "password": "short", "name": "Weak User"},
    )
    assert resp.status_code == 422, resp.text
