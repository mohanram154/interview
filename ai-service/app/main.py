import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import AI_PROVIDER, PORT, HOST
from app.schemas import HealthResponse, EvaluationRequest, EvaluationResponse, SentimentRequest, SentimentResponse
from app.evaluator import evaluate_candidate_answer
from app.sentiment import analyze_sentiment

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("ai_service")

app = FastAPI(
    title="Interview AI & NLP Service",
    description="Automated Candidate Technical Evaluation and Text Sentiment Analytics Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="UP",
        provider=AI_PROVIDER,
        version="1.0.0"
    )

@app.post("/internal/evaluate", response_model=EvaluationResponse)
def evaluate(request: EvaluationRequest):
    if not request.questionText.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question text cannot be empty.")
    if not request.answerText.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Answer text cannot be empty.")

    try:
        response = evaluate_candidate_answer(request)
        return response
    except Exception as e:
        logger.error(f"Error evaluating answer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )

@app.post("/internal/sentiment", response_model=SentimentResponse)
def sentiment(request: SentimentRequest):
    try:
        return analyze_sentiment(request.text)
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sentiment analysis failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
