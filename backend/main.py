from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from chat import router as chat_router
from routine import router as routine_router
from resources import router as resources_router
from mood_tracker import router as mood_router, load_moods
from state import user_manager
from models import CrisisLocation


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_moods()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/chat")
app.include_router(routine_router, prefix="/routine")
app.include_router(resources_router, prefix="/resources")
app.include_router(mood_router)

@app.get("/api/user/status")
async def get_user_status():
    return user_manager.get_status()

@app.post("/api/crisis/resources")
async def get_crisis_resources(location: CrisisLocation):
    # Mock resources based on location (in reality, would use Google Maps API or similar)
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
