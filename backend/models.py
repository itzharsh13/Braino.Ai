from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: str = "English"
    emotion: str | None = None
    emotion_confidence: float | None = None
    history: list[ChatHistoryMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    response: str

class CrisisLocation(BaseModel):
    latitude: float
    longitude: float
