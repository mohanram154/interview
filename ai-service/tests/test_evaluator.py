import pytest
from app.schemas import EvaluationRequest, SentimentRequest
from app.evaluator import evaluate_candidate_answer
from app.sentiment import analyze_sentiment
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "provider" in data

def test_baseline_evaluation_good_answer():
    req = EvaluationRequest(
        questionText="Explain the difference between HashMap and ConcurrentHashMap in Java.",
        answerText="ConcurrentHashMap achieves thread safety through bucket level locking and CAS operations without locking the entire table. It is much more concurrent than a synchronized map.",
        jobRole="Java Developer",
        difficulty="INTERMEDIATE",
        category="Core Java",
        expectedTopics="bucket level locking, CAS, synchronized block, synchronized map, segments, concurrency, performance"
    )
    result = evaluate_candidate_answer(req)
    assert result.overallScore >= 50.0
    assert result.technicalAccuracyScore >= 50.0
    assert result.relevanceScore >= 50.0
    assert len(result.strengths) > 0
    assert result.evaluationMethod == "BASELINE"
    assert result.evaluationStatus == "COMPLETED"

def test_baseline_evaluation_short_answer():
    req = EvaluationRequest(
        questionText="What is the Java Memory Model?",
        answerText="It has heap and stack.",
        jobRole="Java Developer",
        difficulty="INTERMEDIATE",
        category="JVM",
        expectedTopics="heap, stack, garbage collection, Eden, survivor, tenured, generational GC"
    )
    result = evaluate_candidate_answer(req)
    assert 0.0 <= result.overallScore <= 100.0
    assert len(result.improvements) > 0

def test_sentiment_analysis():
    text = "Basically, um, I guess it is like, uh, doing something."
    res = analyze_sentiment(text)
    assert res.fillerWordsCount >= 3
    assert res.clarityLevel in ("LOW_CONCISENESS", "MODERATE")

    good_text = "This architecture is robust, highly scalable, and efficient for concurrent execution."
    good_res = analyze_sentiment(good_text)
    assert good_res.sentimentLabel == "POSITIVE"
    assert "scalable" in good_res.positiveIndicators or "robust" in good_res.positiveIndicators

def test_evaluate_endpoint_validation():
    # Empty question
    resp = client.post("/internal/evaluate", json={
        "questionText": "",
        "answerText": "Some answer",
        "jobRole": "Java Developer",
        "difficulty": "BEGINNER"
    })
    assert resp.status_code == 400

    # Empty answer
    resp2 = client.post("/internal/evaluate", json={
        "questionText": "What is Python?",
        "answerText": "",
        "jobRole": "Python Developer",
        "difficulty": "BEGINNER"
    })
    assert resp2.status_code == 400
