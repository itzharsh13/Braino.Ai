import os

os.environ.pop("GEMINI_API_KEY", None)
os.environ.pop("MONGO_URL", None)
os.environ.setdefault("JWT_SECRET", "test-secret-for-local-validation-only")

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_chat_accepts_history_and_returns_braino_response():
    response = client.post(
        "/chat/",
        json={
            "message": "Preparation complete nahi hai.",
            "history": [
                {"role": "user", "content": "Mujhe exam ko lekar stress hai."},
                {"role": "assistant", "content": "Sabse zyada tension kis part ko lekar hai?"},
            ],
        },
    )
    assert response.status_code == 200, response.text
    assert isinstance(response.json()["response"], str)


def test_chat_rejects_oversized_messages():
    response = client.post("/chat/", json={"message": "x" * 4001})
    assert response.status_code == 422