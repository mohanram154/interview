import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import AI_PROVIDER, PORT, HOST, INTERNAL_SERVICE_KEY
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
from app.speech_analytics import (
    process_transcription,
    analyze_fluency_and_hesitation,
    analyze_tone_and_prosody,
    analyze_speech_rate_and_sentiment,
    evaluate_technical_answer,
    compute_confidence_calibration,
    calculate_weighted_video_question_score
)

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

def verify_internal_service_key(
    x_internal_service_key: Optional[str] = Header(None, alias="X-Internal-Service-Key"),
    authorization: Optional[str] = Header(None)
):
    """
    Enforces service-to-service authentication between Spring Boot backend and Python AI microservice.
    Accepts key via 'X-Internal-Service-Key' header or 'Authorization: Bearer <key>'.
    """
    if not INTERNAL_SERVICE_KEY:
        return True
    
    token = x_internal_service_key
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        
    if not token or token != INTERNAL_SERVICE_KEY:
        logger.warning("Unauthorized service request to internal endpoint. Missing or invalid service token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized service request: Invalid or missing internal service key."
        )
    return True

@app.post("/internal/evaluate", response_model=EvaluationResponse, dependencies=[Depends(verify_internal_service_key)])
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

@app.post("/internal/sentiment", response_model=SentimentResponse, dependencies=[Depends(verify_internal_service_key)])
def sentiment(request: SentimentRequest):
    try:
        return analyze_sentiment(request.text)
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sentiment analysis failed: {str(e)}"
        )

@app.post("/internal/resume/parse", dependencies=[Depends(verify_internal_service_key)])
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

@app.post("/internal/resume/evaluate", dependencies=[Depends(verify_internal_service_key)])
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

@app.post("/internal/video/analyze-recording", dependencies=[Depends(verify_internal_service_key)])
async def analyze_video_recording(
    file: UploadFile = File(...),
    transcript: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None),
    question_text: Optional[str] = Form(None),
    duration_seconds: Optional[float] = Form(0.0),
    word_timestamps_json: Optional[str] = Form(None)
):
    """
    Analyzes uploaded candidate video recording and accompanying spoken speech transcript.
    Inspects container integrity, size, duration, acoustic prosody, speech rate,
    hesitation/pause metrics, technical accuracy against role benchmarks,
    and contradiction-weighted confidence calibration.
    Never invents missing speech data or fake transcripts.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recording filename cannot be empty.")

    filename_lower = file.filename.lower()
    valid_extensions = ('.webm', '.mp4', '.mkv', '.wav')
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

    # Parse optional client word timestamps
    client_timestamps: Optional[List[Dict[str, Any]]] = None
    if word_timestamps_json and word_timestamps_json.strip():
        try:
            parsed = json.loads(word_timestamps_json)
            if isinstance(parsed, list):
                client_timestamps = parsed
        except Exception:
            client_timestamps = None

    duration = float(duration_seconds) if duration_seconds is not None else 0.0

    # 1. Process transcription and word timestamps
    trans_info = process_transcription(transcript, client_timestamps, duration)
    effective_transcript = trans_info["transcript"]

    # 2. Fluency and hesitation metrics
    fluency_info = analyze_fluency_and_hesitation(effective_transcript, trans_info["wordTimestamps"], duration)

    # 3. Acoustic prosody & tone dynamics
    prosody_info = analyze_tone_and_prosody(file_bytes, file.filename, duration)

    # 4. Speech rate & linguistic sentiment
    rate_info = analyze_speech_rate_and_sentiment(effective_transcript, duration, prosody_info["prosodyStatus"])

    # 5. Technical competency evaluation against role benchmarks
    effective_role = target_role if target_role and target_role.strip() else "Software Developer"
    effective_q = question_text if question_text and question_text.strip() else "Technical interview question"
    tech_info = evaluate_technical_answer(effective_q, effective_transcript, effective_role)

    # 6. Contradiction-weighted confidence scoring
    calib_info = compute_confidence_calibration(effective_transcript, tech_info["technicalScore"])

    # 7. Weighted Composite Video Score (40% Tech, 20% Relevance, 15% Concepts, 15% Fluency, 10% Completeness)
    question_score = calculate_weighted_video_question_score(
        technical_score=tech_info["technicalScore"],
        relevance_score=tech_info["relevanceScore"],
        concept_score=tech_info["conceptUsageScore"],
        fluency_score=fluency_info["fluencyScore"],
        completeness_score=tech_info["completenessScore"]
    )

    analysis_data = {
        "filename": file.filename,
        "fileSizeBytes": file_size,
        "format": "webm" if filename_lower.endswith(".webm") else "wav" if filename_lower.endswith(".wav") else "mp4",
        "hasTranscript": bool(effective_transcript),
        "transcript": effective_transcript,
        # Transcription
        "transcriptionStatus": trans_info["transcriptionStatus"],
        "transcriptionProvider": trans_info["transcriptionProvider"],
        "transcriptionNotes": trans_info["transcriptionNotes"],
        "wordTimestamps": trans_info["wordTimestamps"],
        # Fluency & Hesitation
        "fillerWordsCount": fluency_info["fillerWordsCount"],
        "fillerWordRate": fluency_info["fillerWordRate"],
        "pauseCount": fluency_info["pauseCount"],
        "avgPauseDuration": fluency_info["avgPauseDuration"],
        "longestPauseDuration": fluency_info["longestPauseDuration"],
        "repeatedWordsCount": fluency_info["repeatedWordsCount"],
        "fluencyScore": fluency_info["fluencyScore"],
        "fluencyNotes": fluency_info["fluencyNotes"],
        # Prosody & Tone
        "prosodyStatus": prosody_info["prosodyStatus"],
        "pitchVariation": prosody_info["pitchVariation"],
        "vocalEnergyVariation": prosody_info["vocalEnergyVariation"],
        "speechRhythmScore": prosody_info["speechRhythmScore"],
        "prosodyNotes": prosody_info["prosodyNotes"],
        # Speech Rate & Sentiment
        "speakingWpm": rate_info["speakingWpm"],
        "totalWpm": rate_info["totalWpm"],
        "sentimentLabel": rate_info["sentimentLabel"],
        "sentimentReliability": rate_info["sentimentReliability"],
        "vocalIntensity": rate_info["vocalIntensity"],
        # Technical Evaluation
        "technicalScore": tech_info["technicalScore"],
        "relevanceScore": tech_info["relevanceScore"],
        "completenessScore": tech_info["completenessScore"],
        "conceptUsageScore": tech_info["conceptUsageScore"],
        "matchedKeyPoints": tech_info["matchedKeyPoints"],
        "missingKeyPoints": tech_info["missingKeyPoints"],
        "evaluatorModel": tech_info["evaluatorModel"],
        "feedback": tech_info["feedback"],
        "improvementSuggestions": tech_info["improvementSuggestions"],
        # Confidence Calibration
        "linguisticConfidenceScore": calib_info["linguisticConfidenceScore"],
        "confidenceCalibrationLabel": calib_info["confidenceCalibrationLabel"],
        "confidenceDelta": calib_info["confidenceDelta"],
        "confidenceCalibrationExplanation": calib_info["confidenceCalibrationExplanation"],
        # Composite Question Score
        "questionScore": question_score,
        # Backwards compatibility block
        "speechSentiment": {
            "sentimentLabel": rate_info["sentimentLabel"],
            "sentimentConfidence": 0.9 if rate_info["sentimentReliability"] == "HIGH" else 0.75,
            "fillerWordsCount": fluency_info["fillerWordsCount"],
            "clarityLevel": "HIGH" if fluency_info["fluencyScore"] >= 80 else "MODERATE" if fluency_info["fluencyScore"] >= 65 else "DEVELOPING",
            "hesitationMarkers": [f"{fluency_info['pauseCount']} pauses", f"{fluency_info['fillerWordsCount']} fillers"],
            "positiveIndicators": tech_info["matchedKeyPoints"][:3]
        }
    }

    return {"success": True, "data": analysis_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
