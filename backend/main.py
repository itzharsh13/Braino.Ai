import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


def _validate_required_env():
    required = ["JWT_SECRET"]
    missing = []
    for name in required:
        value = os.getenv(name)
        if not value or not value.strip():
            missing.append(name)

    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing required environment variables: {joined}")

    os.environ.setdefault("APP_ENV", "development")
    os.environ.setdefault("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")


_validate_required_env()

from auth import router as auth_router
from chat import router as chat_router
from routine import router as routine_router
from resources import router as resources_router
from mood_tracker import router as mood_router, load_moods
from state import user_manager
from models import CrisisLocation


def _allowed_origins():
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_moods()
    yield


app = FastAPI(
    title="Braino AI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app$|http://localhost:\d+$|http://127\.0\.0\.1:\d+$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http://localhost:5173 http://127.0.0.1:5173 "
        "http://localhost:8000 http://127.0.0.1:8000 https:; "
        "frame-ancestors 'none'; "
        "object-src 'none'; "
        "base-uri 'self'"
    )
    return response


app.include_router(auth_router)
app.include_router(chat_router, prefix="/chat")
app.include_router(routine_router, prefix="/routine")
app.include_router(resources_router, prefix="/resources")
app.include_router(mood_router)

@app.get("/api/user/status")
async def get_user_status():
    return user_manager.get_status()

@app.post("/api/crisis/resources")
async def get_crisis_resources(location: CrisisLocation):
    return {
        "resources": [
            {"name": "National Suicide Prevention Lifeline", "contact": "988", "type": "Global"},
            {"name": "Local Crisis Center", "contact": "555-0123", "type": "Local", "address": "123 Hope St (Mock Address)"},
            {"name": "Emergency Services", "contact": "911", "type": "Emergency"}
        ]
    }

@app.get("/")
async def root():
    return {"message": "Welcome to Braino AI Backend", "status": "ok"}


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy"}
