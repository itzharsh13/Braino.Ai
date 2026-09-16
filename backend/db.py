import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
client = None
db = None


def _get_client():
    global client, db
    if MONGO_URL is None:
        raise RuntimeError("MONGO_URL is not configured")
    if client is None:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[MONGO_DB_NAME] if MONGO_DB_NAME else client.get_default_database()
    return db


def get_db():
    if db is None:
        return _get_client()
    return db


def get_collection(name: str):
    database = get_db()
    return database[name]
