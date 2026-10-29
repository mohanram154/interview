import re
from typing import List, Tuple
from app.schemas import SentimentResponse

FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "actually", "sort of",
    "kind of", "i guess", "maybe", "probably", "literally"
]

POSITIVE_MARKERS = [
    "efficient", "scalable", "robust", "optimized", "clean", "maintainable",
    "reliable", "tested", "secure", "effective", "decoupled", "modular",
    "consistent", "standard", "structured", "advantage", "benefit"
]

HESITATION_PATTERNS = [
    r"\bi think maybe\b",
    r"\bi am not really sure\b",
    r"\bprobably could be\b",
    r"\bi don't know\b",
    r"\bsomething like that\b"
]

def analyze_sentiment(text: str) -> SentimentResponse:
    if not text or not text.strip():
        return SentimentResponse(
            sentimentLabel="NEUTRAL",
            sentimentConfidence=1.0,
            positiveIndicators=[],
            fillerWordsCount=0,
            hesitationMarkers=[],
            clarityLevel="EMPTY"
        )

    lower_text = text.lower()
    words = re.findall(r"\b[a-z']+\b", lower_text)
    total_words = len(words)

    # 1. Count filler words
    filler_count = 0
    for filler in FILLER_WORDS:
        if " " in filler:
            matches = len(re.findall(r"\b" + re.escape(filler) + r"\b", lower_text))
            filler_count += matches
        else:
            matches = words.count(filler)
            filler_count += matches

    # 2. Find positive professional indicators
    positive_found = []
    for pos in POSITIVE_MARKERS:
        if re.search(r"\b" + re.escape(pos) + r"\b", lower_text):
            positive_found.append(pos)

    # 3. Hesitation markers
    hesitations = []
    for pattern in HESITATION_PATTERNS:
        matches = re.findall(pattern, lower_text)
        if matches:
            hesitations.extend(matches)

    # 4. Sentiment label calculation
    # In technical interviews, clear and structured technical vocabulary yields POSITIVE sentiment
    if len(positive_found) >= 3 and len(hesitations) == 0:
        sentiment_label = "POSITIVE"
        confidence = 0.88
    elif len(hesitations) >= 2 or (filler_count > 4 and len(positive_found) == 0):
        sentiment_label = "NEGATIVE"
        confidence = 0.78
    else:
        sentiment_label = "NEUTRAL"
        confidence = 0.85

    # 5. Clarity level
    filler_ratio = filler_count / max(1, total_words)
    if filler_ratio > 0.15:
        clarity_level = "LOW_CONCISENESS"
    elif filler_ratio > 0.05:
        clarity_level = "MODERATE"
    else:
        clarity_level = "HIGH"

    return SentimentResponse(
        sentimentLabel=sentiment_label,
        sentimentConfidence=round(confidence, 2),
        positiveIndicators=positive_found[:5],
        fillerWordsCount=filler_count,
        hesitationMarkers=hesitations[:3],
        clarityLevel=clarity_level
    )

