from fastapi import APIRouter
from models import ChatRequest, ChatResponse
from state import user_manager
from mental_health_resources import get_all_resources
from ml_paths import model_file
import pickle
import random

router = APIRouter()

_model = None
_le = None


def _load_ml():
    global _model, _le
    if _model is not None:
        return _model, _le

    model_path = model_file("model.pkl")
    if not model_path.is_file():
        return None, None

    with open(model_path, "rb") as f:
        _model = pickle.load(f)

    le_path = model_file("label_encoder.pkl")
    try:
        with open(le_path, "rb") as f:
            _le = pickle.load(f)
    except FileNotFoundError:
        _le = None

    return _model, _le

# Fallback for features
FEATURES = [f'feature_{i}' for i in range(30)]

# Mapping 30 features to user friendly symptoms and keywords
SYMPTOM_KEYWORDS = {
    "feature_0": ["concentration", "concentrating", "focus", "dhyan", "attention"],
    "feature_1": ["sleep", "insomnia", "neend", "nightmare", "oversleeping", "sleepless"],
    "feature_2": ["tension", "physical tension", "stiff", "tightness"],
    "feature_3": ["anxiety", "anxious", "worry", "worried", "ghabrahat", "tension"],
    "feature_4": ["fatigue", "tired", "thakan", "exhausted", "low energy"],
    "feature_5": ["failure", "fail", "fear of failure"],
    "feature_6": ["negative self-talk", "self-doubt", "critic", "not good enough", "worthless"],
    "feature_7": ["perfectionism", "perfect", "flawless"],
    "feature_8": ["avoidance", "avoiding", "avoid"],
    "feature_9": ["energy", "low energy", "weak", "lazy"],
    "feature_10": ["withdrawal", "withdrawal from family", "social withdrawal", "isolate", "lonely", "alone"],
    "feature_11": ["irritability", "anger", "angry", "gussa", "irritated"],
    "feature_12": ["procrastination", "procrastinate", "delaying", "lazy"],
    "feature_13": ["muscle tension", "body ache", "muscles hurt"],
    "feature_14": ["heartbeat", "rapid heartbeat", "heart racing", "palpitations"],
    "feature_15": ["sweating", "sweat", "sweaty"],
    "feature_16": ["breath", "shortness of breath", "breathless", "suffocation"],
    "feature_17": ["chest pain", "chest tightness", "chest hurts"],
    "feature_18": ["nausea", "sick", "vomit"],
    "feature_19": ["dizziness", "dizzy", "lightheaded"],
    "feature_20": ["losing control", "lose control", "going crazy"],
    "feature_21": ["judgment", "fear of judgment", "judged"],
    "feature_22": ["self-consciousness", "self-conscious", "shy"],
    "feature_23": ["embarrassment", "embarrassed", "humiliated"],
    "feature_24": ["health worry", "illness", "disease", "hypochondria", "sick"],
    "feature_25": ["doctor", "frequent doctor visits", "hospital"],
    "feature_26": ["body checking", "body checks", "checking body"],
    "feature_27": ["avoiding health info", "avoid medical"],
    "feature_28": ["reassurance", "reassurance seeking", "seeking reassurance"],
    "feature_29": ["sad", "sadness", "udaas", "depressed", "depression", "hopeless", "down"]
}

# Generate symptom map using our keywords
def generate_symptom_map():
    symptom_map = {}
    for feature in FEATURES:
        keywords = SYMPTOM_KEYWORDS.get(feature, [feature.replace("_", " ")])
        symptom_map[feature] = list(set([feature.replace("_", " ")] + keywords))
    return symptom_map

SYMPTOM_MAP = generate_symptom_map()

# Map the 22 integer outputs of the model to actual mental health resources
CONDITION_MAPPING = {
    0: {"id": 1, "name": "Generalized Anxiety Disorder (GAD)"},
    1: {"id": 2, "name": "Panic Attacks"},
    2: {"id": 3, "name": "Social Anxiety"},
    3: {"id": 4, "name": "Health Anxiety (Hypochondria)"},
    4: {"id": 5, "name": "Performance Anxiety"},
    5: {"id": 6, "name": "Major Depressive Disorder"},
    6: {"id": 7, "name": "Seasonal Affective Disorder (SAD)"},
    7: {"id": 8, "name": "Persistent Depressive Disorder (Dysthymia)"},
    8: {"id": 9, "name": "Postpartum Depression"},
    9: {"id": 10, "name": "Atypical Depression"},
    10: {"id": 11, "name": "Chronic Stress"},
    11: {"id": 12, "name": "Work-Related Stress"},
    12: {"id": 13, "name": "Financial Stress"},
    13: {"id": 14, "name": "Relationship Stress"},
    14: {"id": 15, "name": "Academic Stress"},
    15: {"id": 16, "name": "Insomnia"},
    16: {"id": 17, "name": "Sleep Anxiety"},
    17: {"id": 18, "name": "Nightmares and Night Terrors"},
    18: {"id": 19, "name": "Oversleeping (Hypersomnia)"},
    19: {"id": 20, "name": "Circadian Rhythm Disruption"},
    20: {"id": 21, "name": "Low Self-Esteem"},
    21: {"id": 22, "name": "Imposter Syndrome"}
}

def get_resource_by_id(res_id: int):
    for r in get_all_resources():
        if r['id'] == res_id:
            return r
    return None

def extract_symptoms(message: str):
    message = message.lower()
    symptoms = {}

    for feature, keywords in SYMPTOM_MAP.items():
        for keyword in keywords:
            if keyword in message:
                symptoms[feature] = 1

    return symptoms

def predict_disease(symptoms):
    model, le = _load_ml()
    if model is None:
        return None

    input_data = {f: 0 for f in FEATURES}
    input_data.update(symptoms)

    dordered_input = [input_data[feature] for feature in FEATURES]
    pred = model.predict([ordered_input])

    if le is not None:
        return le.inverse_transform(pred)[0]

    return str(pred[0])

FACIAL_EMOTION_HINTS = {
    "sad": "I can see you might be feeling down. I'm here with you — take your time.",
    "angry": "You seem frustrated. It's okay to feel that way. Want to talk about what's bothering you?",
    "fearful": "You look a bit anxious. Try a slow breath with me: inhale 4 seconds, hold 4, exhale 6.",
    "disgusted": "Something seems uncomfortable for you. I'm listening if you want to share.",
    "happy": "You have a positive expression — that's wonderful! How can I support you today?",
    "surprised": "You seem surprised! I'm here if something unexpected is on your mind.",
    "neutral": "I'm here whenever you're ready to talk.",
}


def facial_emotion_reply(emotion: str | None) -> str | None:
    if not emotion:
        return None
    return FACIAL_EMOTION_HINTS.get(emotion.lower())


def ai_conversation(message: str, facial_emotion: str | None = None):
    msg = message.lower()

    emotion_line = facial_emotion_reply(facial_emotion)
    if emotion_line and any(x in msg for x in ["hi", "hello", "hey", "namaste", "how are"]):
        return emotion_line

    if any(x in msg for x in ["hi", "hello", "hey", "namaste"]):
        return "Hi 😊 Main yahan hoon help ke liye."

    if any(x in msg for x in ["sad", "udaas"]):
        return "Mujhe afsos hai aap aisa feel kar rahe ho. Main aapke sath hoon."

    if any(x in msg for x in ["anxious", "tension"]):
        return "Aap tension me lag rahe ho. Deep breathing try karo (Inhale 4s, Hold 7s, Exhale 8s)."

    if emotion_line:
        return f"{emotion_line} Aap apni problem bata sakte ho — main sun raha hoon."

    return "Aap apni problem bata sakte ho. Main sun raha hoon."

CRISIS_KEYWORDS = ["suicide", "kill myself", "marna hai"]

def get_response(message: str, facial_emotion: str | None = None):
    msg = message.lower()

    # Crisis keywords check
    for word in CRISIS_KEYWORDS:
        if word in msg:
            return "Please seek immediate help. You are not alone. You can call the National Suicide Prevention Lifeline at 988 or reach out to someone you trust."

    user_manager.add_points(10)

    symptoms = extract_symptoms(message)

    if len(symptoms) > 0:
        pred_class = predict_disease(symptoms)
        if pred_class is None:
            return ai_conversation(message, facial_emotion)
        try:
            pred_idx = int(pred_class)
            mapping = CONDITION_MAPPING.get(pred_idx)
            if mapping:
                res_id = mapping["id"]
                resource = get_resource_by_id(res_id)
                if resource:
                    detected_symptom_names = []
                    for feat in symptoms.keys():
                        if feat in SYMPTOM_KEYWORDS and len(SYMPTOM_KEYWORDS[feat]) > 0:
                            detected_symptom_names.append(SYMPTOM_KEYWORDS[feat][0].title())
                    
                    symptoms_str = ", ".join(detected_symptom_names)
                    solutions_str = "\n".join([f"• {s}" for s in resource['solutions'][:3]])
                    
                    response = (
                        f"I've listened to you carefully. Based on our conversation, I detected the following symptoms: **{symptoms_str}**.\n\n"
                        f"These patterns are often related to **{resource['problem']}**.\n\n"
                        f"**Understanding this:** {resource['description']}\n\n"
                        f"💡 **Here are 3 concrete strategies you can try right now:**\n{solutions_str}\n\n"
                        f"Would you like me to help you design a daily routine to manage this?"
                    )
                    return response
        except Exception as e:
            pass

        return f"Detected symptoms: {', '.join(symptoms.keys())}. Possible condition index: {pred_class}"

    return ai_conversation(message, facial_emotion)

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    emotion = request.emotion if (request.emotion_confidence or 0) >= 0.35 else None
    return ChatResponse(response=get_response(request.message, emotion))
