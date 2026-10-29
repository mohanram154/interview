from pydantic import BaseModel, Field
from typing import List, Optional

class HealthResponse(BaseModel):
    status: str
    service: str = "Candidate Interview Evaluation AI Service"
    provider: str
    version: str = "1.0.0"

class EvaluationRequest(BaseModel):
    questionText: str = Field(..., description="The interview question text")
    answerText: str = Field(..., description="The candidate's response")
    jobRole: str = Field(..., description="Role e.g., Java Developer, Python Developer")
    difficulty: str = Field("INTERMEDIATE", description="Difficulty: BEGINNER, INTERMEDIATE, ADVANCED")
    category: Optional[str] = Field(None, description="Technical category e.g., Concurrency, JVM")
    expectedTopics: Optional[str] = Field(None, description="Keywords and expected architectural concepts")

class EvaluationResponse(BaseModel):
    technicalAccuracyScore: float = Field(..., ge=0.0, le=100.0)
    relevanceScore: float = Field(..., ge=0.0, le=100.0)
    completenessScore: float = Field(..., ge=0.0, le=100.0)
    clarityScore: float = Field(..., ge=0.0, le=100.0)
    overallScore: float = Field(..., ge=0.0, le=100.0)
    sentimentLabel: Optional[str] = "NEUTRAL"
    sentimentConfidence: Optional[float] = 0.85
    feedback: str
    strengths: List[str]
    improvements: List[str]
    evaluationMethod: str = "BASELINE"
    evaluationStatus: str = "COMPLETED"

class SentimentRequest(BaseModel):
    text: str = Field(..., description="Answer text for linguistic and sentiment analysis")

class SentimentResponse(BaseModel):
    sentimentLabel: str
    sentimentConfidence: float
    positiveIndicators: List[str]
    fillerWordsCount: int
    hesitationMarkers: List[str]
    clarityLevel: str
    disclaimer: str = (
        "Text sentiment analysis evaluates linguistic structure and vocabulary only. "
        "It does not evaluate technical proficiency, integrity, confidence, or candidate job suitability."
    )

