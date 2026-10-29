import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://localhost:8080/api/v1"

def api_call(endpoint, method="GET", payload=None, token=None, files=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    data = None

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if files:
        boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        body_parts = []
        for field_name, (filename, content, mime) in files.items():
            part = (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'
                f"Content-Type: {mime}\r\n\r\n"
            ).encode("utf-8") + content + b"\r\n"
            body_parts.append(part)
        body_parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        data = b"".join(body_parts)
    elif payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read()
            content_type = response.headers.get("Content-Type", "")
            cache_control = response.headers.get("Cache-Control", "")
            return {
                "status": response.status,
                "body": json.loads(res_body.decode("utf-8")) if "application/json" in content_type else res_body,
                "headers": {"Content-Type": content_type, "Cache-Control": cache_control}
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(error_body)
        except Exception:
            parsed = error_body
        return {
            "status": e.code,
            "body": parsed,
            "error": True
        }

def run_tests():
    print("==================================================================")
    print("ROUND 3: AI VIDEO INTERVIEW E2E VERIFICATION TEST")
    print("==================================================================")

    # 1. Login / Register Candidate 1
    email1 = f"candidate_video_{uuid.uuid4().hex[:6]}@example.com"
    reg1_resp = api_call("/auth/register", method="POST", payload={
        "name": "Primary Candidate",
        "email": email1,
        "password": "Password123!"
    })
    assert reg1_resp["status"] in [200, 201], f"Register failed: {reg1_resp}"
    token = reg1_resp["body"]["data"]["token"]
    print(f"[PASS] Primary candidate registered & logged in ({email1}).")

    # Login / Register second candidate for isolation testing
    email2 = f"candidate2_{uuid.uuid4().hex[:6]}@example.com"
    reg2_resp = api_call("/auth/register", method="POST", payload={
        "name": "Candidate Two",
        "email": email2,
        "password": "Password123!"
    })
    token2 = reg2_resp["body"]["data"]["token"]
    print(f"[PASS] Second candidate initialized ({email2}) for cross-tenant isolation.")

    # 2. Create New Assessment Session
    create_resp = api_call("/assessment-sessions", method="POST", payload={
        "jobRoleId": 1,
        "difficulty": "INTERMEDIATE",
        "questionCount": 20
    }, token=token)
    assert create_resp["status"] == 201, f"Session creation failed: {create_resp}"
    session_id = create_resp["body"]["data"]["id"]
    print(f"[PASS] Created new Assessment Session ID: {session_id}")

    # =========================================================================
    # CHECKPOINT 1: Strict Locking Enforcement before Resume & MCQ
    # =========================================================================
    consent_lock = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={"consentGiven": True}, token=token)
    assert consent_lock["status"] == 400, f"Expected 400, got: {consent_lock['status']}"
    assert "Complete Resume Evaluation to unlock this round" in str(consent_lock["body"])
    print("[PASS] Checkpoint 1A: Video consent rejected before Resume completion (HTTP 400).")

    q_lock = api_call(f"/assessment-sessions/{session_id}/video/questions", method="GET", token=token)
    assert q_lock["status"] == 400, f"Expected 400, got: {q_lock['status']}"
    print("[PASS] Checkpoint 1B: Video questions rejected before Resume completion (HTTP 400).")

    # Complete Resume Round with real evaluation and persistence
    resume_comp = api_call(f"/assessment-sessions/{session_id}/resume/evaluate", method="POST", payload={
        "targetRole": "Full Stack Developer",
        "companyName": "Tech Corp",
        "jobDescription": "Full Stack developer with React, Java Spring Boot, and Cloud Architecture",
        "correctedData": {
            "contactDetails": {
                "name": "Jane Developer",
                "email": "jane@example.com",
                "phone": "+1-555-0199",
                "linkedin": "linkedin.com/in/janedev",
                "github": "github.com/janedev"
            },
            "summary": "Full Stack Engineer with 4 years experience building scalable enterprise services.",
            "technicalSkills": {
                "programmingLanguages": ["Java", "TypeScript", "Python"],
                "frameworks": ["Spring Boot", "React", "Node.js"],
                "databases": ["PostgreSQL", "Redis", "MySQL"],
                "toolsAndPlatforms": ["Docker", "Kubernetes", "AWS"]
            },
            "projects": [
                {
                    "title": "Cloud Distributed E-Commerce",
                    "technologies": "Java, Spring Boot, React, Kafka, PostgreSQL",
                    "description": "Architected resilient microservices with event sourcing and distributed caching."
                },
                {
                    "title": "Real-time Telemetry Dashboard",
                    "technologies": "TypeScript, React, WebSockets, Python",
                    "description": "Built reactive streaming performance metrics visualizer."
                }
            ],
            "experience": [
                {
                    "company": "Enterprise Cloud Inc",
                    "role": "Full Stack Developer",
                    "duration": "2023 - Present",
                    "description": "Engineered REST APIs and React frontends handling 50k daily active users."
                }
            ],
            "education": [
                {
                    "degree": "B.S. in Computer Science",
                    "institution": "State University",
                    "year": "2022"
                }
            ],
            "certifications": ["AWS Certified Solutions Architect", "Oracle Certified Java Professional"]
        }
    }, token=token)
    assert resume_comp["status"] == 200, f"Resume evaluate failed: {resume_comp}"
    print(f"[PASS] Round 1 (Resume Evaluation) evaluated and persisted (Match Score: {resume_comp['body']['data']['overallMatchScore']}%).")

    # Checkpoint 1C: Video still locked because MCQ not completed
    video_mcq_lock = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={"consentGiven": True}, token=token)
    assert video_mcq_lock["status"] == 400
    assert "Complete MCQ Assessment to unlock this round" in str(video_mcq_lock["body"])
    print("[PASS] Checkpoint 1C: Video consent strictly rejected before MCQ completion (HTTP 400).")

    # Start and Complete MCQ Round
    mcq_start = api_call(f"/assessment-sessions/{session_id}/mcq/start?questionCount=20", method="POST", token=token)
    assert mcq_start["status"] == 200, f"MCQ start failed: {mcq_start}"
    mcq_interview_id = mcq_start["body"]["data"]["id"]
    print(f"[PASS] Round 2 (MCQ Technical Assessment) started with 20 questions (Interview ID: {mcq_interview_id}).")

    mcq_comp = api_call(f"/assessment-sessions/{session_id}/mcq/complete", method="POST", payload={
        "mcqInterviewId": mcq_interview_id,
        "score": 95.0
    }, token=token)
    assert mcq_comp["status"] == 200, f"MCQ complete failed: {mcq_comp}"
    print("[PASS] Round 2 (MCQ Technical Assessment) completed and scored 95.0%.")

    # =========================================================================
    # CHECKPOINT 2: Video Interview Unlocked & Consent Gate
    # =========================================================================
    status_pre = api_call(f"/assessment-sessions/{session_id}/video/status", method="GET", token=token)
    assert status_pre["status"] == 200
    status_data = status_pre["body"]["data"]
    assert status_data["consentGiven"] is False
    print("[PASS] Checkpoint 2A: Video Interview unlocked; initial consent status is False.")

    # Consent rejection if consentGiven is false
    false_consent = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={"consentGiven": False}, token=token)
    assert false_consent["status"] == 400
    print("[PASS] Checkpoint 2B: Video consent endpoint rejects false consent (HTTP 400).")

    # Submit Valid Consent
    valid_consent = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={"consentGiven": True}, token=token)
    assert valid_consent["status"] == 200
    consent_data = valid_consent["body"]["data"]
    assert consent_data["consentGiven"] is True
    assert consent_data["consentGivenAt"] is not None
    assert 5 <= len(consent_data["questions"]) <= 8
    print(f"[PASS] Checkpoint 2C: Consent recorded at {consent_data['consentGivenAt']}; Generated {len(consent_data['questions'])} questions.")

    questions = consent_data["questions"]
    q1 = questions[0]
    q2 = questions[1]
    print(f"       Q1 [{q1['category']}]: {q1['questionText']}")
    print(f"       Q2 [{q2['category']}]: {q2['questionText']}")

    # =========================================================================
    # CHECKPOINT 3: Answer Recording Upload
    # =========================================================================
    dummy_webm_bytes = b"G__WEBM_MOCK_HEADER__VIDEODATA__" * 100
    files1 = {"file": ("answer_q1.webm", dummy_webm_bytes, "video/webm")}
    upload_q1 = api_call(
        f"/assessment-sessions/{session_id}/video/questions/{q1['id']}/upload?duration=45",
        method="POST",
        files=files1,
        token=token
    )
    assert upload_q1["status"] == 200, f"Upload Q1 failed: {upload_q1}"
    q1_result = upload_q1["body"]["data"]
    assert q1_result["status"] == "UPLOADED"
    assert q1_result["hasRecording"] is True
    assert q1_result["recordingDurationSeconds"] == 45
    print(f"[PASS] Checkpoint 3A: Answer recording uploaded for Q1 ({q1_result['recordingFileSize']} bytes).")

    # Upload Q2
    files2 = {"file": ("answer_q2.webm", dummy_webm_bytes, "video/webm")}
    upload_q2 = api_call(
        f"/assessment-sessions/{session_id}/video/questions/{q2['id']}/upload?duration=60",
        method="POST",
        files=files2,
        token=token
    )
    assert upload_q2["status"] == 200
    print("[PASS] Checkpoint 3B: Answer recording uploaded for Q2.")

    # Re-upload / retake Q1 (overwrites previous recording)
    files_retake = {"file": ("answer_q1_retake.webm", dummy_webm_bytes * 2, "video/webm")}
    upload_q1_retake = api_call(
        f"/assessment-sessions/{session_id}/video/questions/{q1['id']}/upload?duration=52",
        method="POST",
        files=files_retake,
        token=token
    )
    assert upload_q1_retake["status"] == 200
    assert upload_q1_retake["body"]["data"]["recordingDurationSeconds"] == 52
    print("[PASS] Checkpoint 3C: Retake/re-upload for Q1 successfully updated recording.")

    # =========================================================================
    # CHECKPOINT 4: Private Storage & Authenticated Streaming
    # =========================================================================
    stream_resp = api_call(
        f"/assessment-sessions/{session_id}/video/questions/{q1['id']}/stream",
        method="GET",
        token=token
    )
    assert stream_resp["status"] == 200
    assert "video/webm" in stream_resp["headers"]["Content-Type"]
    assert "private" in stream_resp["headers"]["Cache-Control"]
    assert len(stream_resp["body"]) > 0
    print("[PASS] Checkpoint 4A: Authenticated private video stream retrieved successfully.")

    # Cross-tenant isolation check: Candidate 2 must be rejected
    stream_hacker = api_call(
        f"/assessment-sessions/{session_id}/video/questions/{q1['id']}/stream",
        method="GET",
        token=token2
    )
    assert stream_hacker["status"] in [401, 403, 404], f"Cross-candidate leak! Got status: {stream_hacker['status']}"
    print(f"[PASS] Checkpoint 4B: Cross-candidate video access strictly forbidden (HTTP {stream_hacker['status']}).")

    # =========================================================================
    # CHECKPOINT 5: Session Refresh & State Recovery
    # =========================================================================
    recovery_resp = api_call(
        f"/assessment-sessions/{session_id}/video/status",
        method="GET",
        token=token
    )
    assert recovery_resp["status"] == 200
    rec_data = recovery_resp["body"]["data"]
    assert rec_data["consentGiven"] is True
    assert rec_data["uploadedQuestions"] >= 2
    print(f"[PASS] Checkpoint 5: Session state recovered across refresh ({rec_data['uploadedQuestions']} questions saved).")

    # =========================================================================
    # CHECKPOINT 6: Round 3 Completion & Final Report Unlock
    # =========================================================================
    finish_resp = api_call(
        f"/assessment-sessions/{session_id}/video/finish",
        method="POST",
        token=token
    )
    assert finish_resp["status"] == 200, f"Finish failed: {finish_resp}"
    fin_data = finish_resp["body"]["data"]
    assert fin_data["videoStageStatus"] == "COMPLETED"
    assert fin_data["videoScore"] is not None
    assert fin_data["finalReportUnlocked"] is True
    print(f"[PASS] Checkpoint 6A: Round 3 (AI Video Interview) completed with Score: {fin_data['videoScore']}%.")
    print(f"       Composite Score: {fin_data['finalCompositeScore']}%")

    # Final report is now unlocked
    report_resp = api_call(
        f"/assessment-sessions/{session_id}/report",
        method="GET",
        token=token
    )
    assert report_resp["status"] == 200
    print("[PASS] Checkpoint 6B: Final Combined Assessment Report accessible after all 3 rounds completed.")

    print("\n==================================================================")
    print("ALL 12 CHECKPOINTS FOR ROUND 3 AI VIDEO INTERVIEW PASSED PERFECTLY!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
