from chat import extract_symptoms, predict_disease


def test_predict_disease_handles_common_symptom_input():
    symptoms = extract_symptoms("I feel anxious and can't sleep")
    assert symptoms
    result = predict_disease(symptoms)
    assert result is not None
