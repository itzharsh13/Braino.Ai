from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from chat import router as chat_router
from routine import router as routine_router
from resources import router as resources_router
from mood_tracker import router as mood_router, load_moods
from state import user_manager
from models import CrisisLocation