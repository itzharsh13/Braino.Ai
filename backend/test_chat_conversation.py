import os

os.environ.pop("GEMINI_API_KEY", None)
os.environ.setdefault("JWT_SECRET", "test-secret-for-local-validation-only")

from chat import fallback_conversation, get_response


def test_identity_response_names_braino_ai():
    response = fallback_conversation("Tum kon ho?")
    assert "Braino AI" in response


def test_symptoms_are_pointwise_without_inventing_extra_symptoms():
    response = fallback_conversation("Mujhe neend nahi aa rahi")
    assert "Difficulty sleeping" in response
    assert "Panic attacks" not in response


def test_follow_up_uses_conversation_context():
    response = fallback_conversation(
        "Preparation complete nahi hai.",
        history=[{"role": "user", "content": "Mujhe exam ko lekar stress hai."}],
    )
    assert "difficult part" in response


def test_crisis_message_uses_safety_response():
    response = get_response("I want to kill myself")
    assert "immediate danger" in response