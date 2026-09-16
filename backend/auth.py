import os
import re
import time
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import DuplicateKeyError, PyMongoError
from pydantic import BaseModel, EmailStr, field_validator

from db import get_collection

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_TTL_SECONDS = int(os.getenv("JWT_TTL_SECONDS", "86400"))

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not configured. Set it in the runtime environment before starting the backend.")

router = APIRouter(prefix="/api/auth")
security = HTTPBearer(auto_error=False)

USERS: Dict[str, Dict[str, Any]] = {}
USE_DATABASE = bool(os.getenv("MONGO_URL"))
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 5


def _users_collection():
    collection = get_collection("users")
    collection.create_index("email", unique=True)
    return collection


def _find_user(email: str) -> Optional[Dict[str, Any]]:
    if not USE_DATABASE:
        return USERS.get(email)

    try:
        user = _users_collection().find_one({"email": email}, {"_id": 0})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication storage is temporarily unavailable.",
        ) from exc
    return user


def _save_user(user: Dict[str, Any]) -> None:
    if not USE_DATABASE:
        USERS[user["email"]] = user
        return

    try:
        _users_collection().insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.") from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication storage is temporarily unavailable.",
        ) from exc


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must include at least one uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must include at least one lowercase letter.")
        if not re.search(r"\d", value):
            raise ValueError("Password must include at least one number.")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("Password must include at least one special character.")
        return value

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Name is required.")
        return name


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPayload(BaseModel):
    sub: str
    exp: int
    iat: int
    role: str = "user"


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"
    return request.client.host if request.client else "unknown"


def _rate_limit_key(request: Request) -> str:
    return f"{_get_client_ip(request)}:{request.url.path}"


def _check_rate_limit(request: Request, max_requests: int = RATE_LIMIT_MAX_REQUESTS, window_seconds: int = RATE_LIMIT_WINDOW_SECONDS) -> None:
    key = _rate_limit_key(request)
    now = int(time.time())
    bucket = getattr(request.app.state, "auth_limiter", {})
    if not hasattr(request.app.state, "auth_limiter"):
        request.app.state.auth_limiter = {}
    requests = bucket.setdefault(key, [])
    requests[:] = [ts for ts in requests if now - ts < window_seconds]
    if len(requests) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a moment and try again.",
        )
    requests.append(now)


def _public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "is_admin": user.get("is_admin", False),
        "created_at": user["created_at"],
    }


def _issue_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=JWT_TTL_SECONDS)).timestamp()),
        "role": "user",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _read_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"require": ["sub", "exp", "iat"]})
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.") from exc
    return payload


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    token = credentials.credentials
    payload = _read_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")

    user = _find_user(email.lower())
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user


def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")
    return current_user


@router.post("/register")
async def register(request: Request, payload: RegisterRequest):
    _check_rate_limit(request)
    normalized_email = payload.email.lower()
    if _find_user(normalized_email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    password_hash = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
    user = {
        "id": f"user_{uuid4().hex}",
        "email": normalized_email,
        "name": payload.name.strip(),
        "password_hash": password_hash,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _save_user(user)
    token = _issue_token(normalized_email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": JWT_TTL_SECONDS,
        "user": _public_user(user),
    }


@router.post("/login")
async def login(request: Request, payload: LoginRequest):
    _check_rate_limit(request)
    normalized_email = payload.email.lower()
    user = _find_user(normalized_email)
    if user is None or not bcrypt.checkpw(payload.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = _issue_token(normalized_email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": JWT_TTL_SECONDS,
        "user": _public_user(user),
    }


@router.get("/me")
async def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return _public_user(current_user)


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully."}


@router.get("/admin/check")
async def admin_check(current_user: Dict[str, Any] = Depends(require_admin)):
    return {"status": "ok", "user": _public_user(current_user)}
