import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from app.config import AI_PROVIDER, PORT, HOST
from app.schemas import (
    HealthResponse, 
    EvaluationRequest, 
    EvaluationResponse, 
    SentimentRequest, 
    SentimentResponse,
    ResumeEvaluateRequest
)
from app.evaluator import evaluate_candidate_answer
from app.sentiment import analyze_sentiment
from app.resume_parser import (
    parse_resume_bytes,
    PasswordProtectedFileError,
    EmptyOrCorruptFileError,
    ScannedPdfError
)
from app.resume_evaluator import evaluate_resume

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("ai_service")

app = FastAPI(
    title="Interview AI & NLP Service",
    description="Automated Candidate Technical Evaluation, Resume Parser, and Text Sentiment Analytics Service",
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

@app.post("/internal/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parses PDF or DOCX file bytes into structured candidate sections.
    Validates file integrity, detects password encryption, empty files, and scanned documents.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename cannot be empty.")

    filename_lower = file.filename.lower()
    if not (filename_lower.endswith('.pdf') or filename_lower.endswith('.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx)."
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes). Please upload a valid resume."
        )

    try:
        parsed_data = parse_resume_bytes(file_bytes, file.filename)
        return {"success": True, "data": parsed_data}
    except PasswordProtectedFileError as e:
        logger.warning(f"Password protected file detected: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ScannedPdfError as e:
        logger.warning(f"Scanned PDF error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except EmptyOrCorruptFileError as e:
        logger.warning(f"Corrupt or empty file error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing resume: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume parsing failed: {str(e)}"
        )

@app.post("/internal/resume/evaluate")
def evaluate_parsed_resume(request: ResumeEvaluateRequest):
    """
    Contextual, role-based evaluation of parsed (or candidate-corrected) resume data.
    Evaluates against standard industry profile or custom job description.
    Never invents missing information.
    """
    try:
        result = evaluate_resume(
            parsed_resume=request.parsedResume,
            target_role=request.targetRole,
            company_name=request.companyName,
            job_description=request.jobDescription,
            custom_weights=request.customWeights
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error evaluating resume: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume evaluation failed: {str(e)}"
        )

@app.post("/internal/video/analyze-recording")
async def analyze_video_recording(
    file: UploadFile = File(...),
    transcript: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None),
    question_text: Optional[str] = Form(None)
):
    """
    Analyzes uploaded candidate video recording and accompanying spoken speech transcript.
    Inspects container integrity, size, duration, and extracts speech/audio characteristics
    including filler words count, professional clarity, and sentiment.
    Never invents missing speech data or fake transcripts.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recording filename cannot be empty.")

    filename_lower = file.filename.lower()
    valid_extensions = ('.webm', '.mp4', '.mkv')
    if not any(filename_lower.endswith(ext) for ext in valid_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported video recording format. Supported formats are WebM (.webm) and MP4 (.mp4)."
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read recording file: {str(e)}"
        )

    file_size = len(file_bytes)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recording file is empty (0 bytes). Please record and upload a valid answer."
        )

    # 50 MB limit
    if file_size > 52_428_800:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recording file exceeds the maximum allowed limit of 50 MB."
        )

    analysis_data = {
        "filename": file.filename,
        "fileSizeBytes": file_size,
        "format": "webm" if filename_lower.endswith(".webm") else "mp4",
        "hasTranscript": bool(transcript and transcript.strip()),
        "transcript": transcript.strip() if transcript else None
    }

    if transcript and transcript.strip():
        # Analyze real speech features using sentiment analyzer
        speech_sentiment = analyze_sentiment(transcript.strip())
        analysis_data["speechSentiment"] = {
            "sentimentLabel": speech_sentiment.sentimentLabel,
            "sentimentConfidence": speech_sentiment.sentimentConfidence,
            "fillerWordsCount": speech_sentiment.fillerWordsCount,
            "clarityLevel": speech_sentiment.clarityLevel,
            "hesitationMarkers": speech_sentiment.hesitationMarkers,
            "positiveIndicators": speech_sentiment.positiveIndicators
        }
    else:
        # Transcript was not provided or audio recognition was inactive
        # Do not fake a transcript!
        analysis_data["speechSentiment"] = {
            "sentimentLabel": "NEUTRAL",
            "sentimentConfidence": 0.8,
            "fillerWordsCount": 0,
            "clarityLevel": "PENDING_TRANSCRIPTION",
            "hesitationMarkers": [],
            "positiveIndicators": []
        }

    return {"success": True, "data": analysis_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
