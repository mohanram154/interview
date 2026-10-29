import re
import json
import logging
from typing import List, Tuple
import httpx
from app.config import AI_PROVIDER, AI_API_KEY, AI_MODEL
from app.schemas import EvaluationRequest, EvaluationResponse
from app.sentiment import analyze_sentiment

logger = logging.getLogger("evaluator")

def evaluate_candidate_answer(request: EvaluationRequest) -> EvaluationResponse:
    # If external provider is configured with an API key, attempt external evaluation
    if AI_PROVIDER in ("gemini", "openai") and AI_API_KEY:
        try:
            if AI_PROVIDER == "gemini":
                return _evaluate_with_gemini(request)
            elif AI_PROVIDER == "openai":
                return _evaluate_with_openai(request)
        except Exception as e:
            logger.warning(f"External AI evaluation failed: {e}. Falling back to baseline NLP evaluator.")

    return _evaluate_baseline(request)

def _evaluate_baseline(request: EvaluationRequest) -> EvaluationResponse:
    answer = (request.answerText or "").strip()
    question = (request.questionText or "").strip()
    topics_raw = (request.expectedTopics or "").lower()

    # Split expected topics
    expected_topics = [t.strip() for t in re.split(r"[,;]+", topics_raw) if len(t.strip()) > 1]
    lower_answer = answer.lower()
    words = re.findall(r"\b[a-z0-9_']+\b", lower_answer)
    word_count = len(words)

    # 1. Check keyword / concept matches (exact phrase or stem matching)
    found_topics = []
    missing_topics = []
    for topic in expected_topics:
        # Check direct substring
        if topic in lower_answer:
            found_topics.append(topic)
            continue
        
        # Check stem / sub-word match for multi-word or compound technical terms
        subwords = [w for w in re.findall(r"\b[a-z]{3,}\b", topic) if w not in ("and", "the", "for", "with")]
        matched_sub = sum(1 for w in subwords if w in lower_answer or any(w[:5] in word for word in words if len(w) >= 5))
        if subwords and (matched_sub / len(subwords)) >= 0.5:
            found_topics.append(topic)
        else:
            missing_topics.append(topic)

    # 2. Technical Accuracy (40% weight): keyword coverage + technical depth
    if expected_topics:
        match_ratio = len(found_topics) / len(expected_topics)
    else:
        match_ratio = 0.6 if word_count >= 20 else 0.3

    base_accuracy = match_ratio * 75.0
    depth_bonus = min(25.0, word_count * 0.6)
    technical_accuracy = max(20.0, min(100.0, base_accuracy + depth_bonus))

    # 3. Relevance (25% weight): alignment with question keywords
    question_terms = [q for q in re.findall(r"\b[a-z]{4,}\b", question.lower()) if q not in ("what", "explain", "describe", "difference", "between", "how")]
    q_matches = [q for q in question_terms if q in lower_answer]
    relevance_ratio = len(q_matches) / max(1, len(question_terms))
    relevance = max(25.0, min(100.0, (relevance_ratio * 60.0) + (40.0 if word_count >= 15 else word_count * 2.0)))

    # 4. Completeness (20% weight): thoroughness of coverage
    completeness = min(100.0, max(15.0, word_count * 1.6))

    # 5. Clarity (15% weight)
    sentiment_res = analyze_sentiment(answer)
    filler_penalty = min(30.0, sentiment_res.fillerWordsCount * 5.0)
    clarity = max(30.0, min(100.0, 85.0 - filler_penalty + (10.0 if word_count > 25 else 0.0)))

    # Weighted Overall Score: 40% Tech, 25% Rel, 20% Comp, 15% Clar
    overall = (technical_accuracy * 0.40) + (relevance * 0.25) + (completeness * 0.20) + (clarity * 0.15)
    overall = round(max(0.0, min(100.0, overall)), 1)

    # Strengths
    strengths = []
    if found_topics:
        strengths.append(f"Demonstrated core competence by accurately discussing: {', '.join(found_topics[:4])}.")
    if word_count > 40:
        strengths.append("Provided a substantive explanation with good technical depth.")
    elif word_count > 15:
        strengths.append("Delivered a clear, direct answer without excessive verbosity.")

    if not strengths:
        strengths.append("Attempted the question with initial foundational context.")

    # Improvements
    improvements = []
    if missing_topics:
        improvements.append(f"Incorporate key architectural and conceptual aspects: {', '.join(missing_topics[:4])}.")
    if word_count < 30:
        improvements.append("Elaborate further with specific implementation steps, trade-offs, or production scenarios.")
    if sentiment_res.fillerWordsCount > 2:
        improvements.append("Minimize conversational filler phrases to maintain crisp technical delivery.")

    if not improvements:
        improvements.append("Consider detailing real-world edge cases and failure modes.")

    feedback = (
        f"Baseline evaluation completed for {request.jobRole} ({request.difficulty}). "
        f"Overall competency: {overall}/100. "
        f"Answer addressed {len(found_topics)} of {max(1, len(expected_topics))} expected core domain topics."
    )

    return EvaluationResponse(
        technicalAccuracyScore=round(technical_accuracy, 1),
        relevanceScore=round(relevance, 1),
        completenessScore=round(completeness, 1),
        clarityScore=round(clarity, 1),
        overallScore=overall,
        sentimentLabel=sentiment_res.sentimentLabel,
        sentimentConfidence=sentiment_res.sentimentConfidence,
        feedback=feedback,
        strengths=strengths,
        improvements=improvements,
        evaluationMethod="BASELINE",
        evaluationStatus="COMPLETED"
    )

def _evaluate_with_gemini(request: EvaluationRequest) -> EvaluationResponse:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{AI_MODEL}:generateContent?key={AI_API_KEY}"
    prompt = f"""
    You are an expert technical interviewer evaluating a candidate for the role of {request.jobRole} ({request.difficulty} level).

    Question: {request.questionText}
    Expected concepts: {request.expectedTopics or 'Standard industry best practices'}
    Candidate Answer: {request.answerText}

    Evaluate strictly according to the following scoring rubric (each score 0 to 100):
    1. Technical Accuracy (40% weight): correctness of facts, APIs, data structures, and architecture.
    2. Relevance (25% weight): how directly it answers the question asked.
    3. Completeness (20% weight): breadth, depth, and edge cases covered.
    4. Clarity (15% weight): organization, conciseness, communication clarity.

    Respond ONLY with a valid JSON object matching this schema:
    {{
        "technicalAccuracyScore": <number 0-100>,
        "relevanceScore": <number 0-100>,
        "completenessScore": <number 0-100>,
        "clarityScore": <number 0-100>,
        "overallScore": <number 0-100>,
        "sentimentLabel": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
        "sentimentConfidence": <number 0.0-1.0>,
        "feedback": "<string>",
        "strengths": ["<string>", "<string>"],
        "improvements": ["<string>", "<string>"]
    }}
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
    }

    with httpx.Client(timeout=10.0) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)

        # Clamping
        tech = max(0.0, min(100.0, float(parsed.get("technicalAccuracyScore", 70))))
        rel = max(0.0, min(100.0, float(parsed.get("relevanceScore", 70))))
        comp = max(0.0, min(100.0, float(parsed.get("completenessScore", 70))))
        clar = max(0.0, min(100.0, float(parsed.get("clarityScore", 70))))
        overall = round((tech * 0.40) + (rel * 0.25) + (comp * 0.20) + (clar * 0.15), 1)

        return EvaluationResponse(
            technicalAccuracyScore=round(tech, 1),
            relevanceScore=round(rel, 1),
            completenessScore=round(comp, 1),
            clarityScore=round(clar, 1),
            overallScore=overall,
            sentimentLabel=parsed.get("sentimentLabel", "NEUTRAL"),
            sentimentConfidence=float(parsed.get("sentimentConfidence", 0.9)),
            feedback=parsed.get("feedback", "AI evaluation completed."),
            strengths=parsed.get("strengths", ["Clear explanation."]),
            improvements=parsed.get("improvements", ["Provide additional examples."]),
            evaluationMethod="EXTERNAL_AI",
            evaluationStatus="COMPLETED"
        )

def _evaluate_with_openai(request: EvaluationRequest) -> EvaluationResponse:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"}
    prompt = f"""
    Evaluate this answer for {request.jobRole} ({request.difficulty}).
    Question: {request.questionText}
    Expected concepts: {request.expectedTopics}
    Candidate Answer: {request.answerText}
    Return valid JSON with keys: technicalAccuracyScore, relevanceScore, completenessScore, clarityScore, overallScore, sentimentLabel, sentimentConfidence, feedback, strengths, improvements.
    """
    payload = {
        "model": AI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        parsed = json.loads(data["choices"][0]["message"]["content"])
        tech = max(0.0, min(100.0, float(parsed.get("technicalAccuracyScore", 70))))
        rel = max(0.0, min(100.0, float(parsed.get("relevanceScore", 70))))
        comp = max(0.0, min(100.0, float(parsed.get("completenessScore", 70))))
        clar = max(0.0, min(100.0, float(parsed.get("clarityScore", 70))))
        overall = round((tech * 0.40) + (rel * 0.25) + (comp * 0.20) + (clar * 0.15), 1)

        return EvaluationResponse(
            technicalAccuracyScore=round(tech, 1),
            relevanceScore=round(rel, 1),
            completenessScore=round(comp, 1),
            clarityScore=round(clar, 1),
            overallScore=overall,
            sentimentLabel=parsed.get("sentimentLabel", "NEUTRAL"),
            sentimentConfidence=float(parsed.get("sentimentConfidence", 0.9)),
            feedback=parsed.get("feedback", "AI evaluation completed."),
            strengths=parsed.get("strengths", ["Good structure"]),
            improvements=parsed.get("improvements", ["Expand on details"]),
            evaluationMethod="EXTERNAL_AI",
            evaluationStatus="COMPLETED"
        )
