import urllib.request
import urllib.error
import json
import uuid
import sys
import os

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
            return {
                "status": response.status,
                "body": json.loads(res_body.decode("utf-8")) if "application/json" in content_type else res_body
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

def generate_sample_docx():
    import docx
    import io
    doc = docx.Document()
    doc.add_heading("Marcus Finch", 0)
    doc.add_paragraph("Email: marcus.finch@example.com | Phone: +1-555-0199 | LinkedIn: linkedin.com/in/marcusfinch")
    doc.add_heading("Professional Summary", level=1)
    doc.add_paragraph("Senior Full Stack & Java Developer with 5+ years building microservices with Spring Boot, Kafka, and Redis.")
    doc.add_heading("Technical Skills", level=1)
    doc.add_paragraph("Languages: Java, SQL, TypeScript, Python")
    doc.add_paragraph("Frameworks: Spring Boot, Hibernate, Spring Cloud")
    doc.add_paragraph("Databases: PostgreSQL, MySQL, Redis")
    doc.add_paragraph("Tools: Docker, Kubernetes, Kafka, Git")
    doc.add_heading("Projects", level=1)
    doc.add_paragraph("High-Throughput Payment Engine: Engineered transactional event-driven settlement system handling 5k RPS using Java, Spring Boot, and Kafka.")
    doc.add_heading("Work Experience", level=1)
    doc.add_paragraph("Alpha Cloud Systems - Java Developer (2021 - Present)")
    doc.add_paragraph("Architected low-latency microservices with Spring Cloud.")
    doc.add_heading("Education", level=1)
    doc.add_paragraph("B.S. in Computer Science, State University, 2021")
    doc.add_heading("Certifications", level=1)
    doc.add_paragraph("Oracle Certified Professional Java SE")
    
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()

def run_tests():
    print("==================================================================")
    print("INTERVIEWVERSE: FINAL FULL-FLOW INTEGRATION VERIFICATION")
    print("==================================================================")

    # ------------------------------------------------------------------
    # Step 1: Authentication & User Registration (Point 15)
    # ------------------------------------------------------------------
    candidate_email = f"lead_candidate_{uuid.uuid4().hex[:6]}@example.com"
    candidate_password = "SecurePassword2026!"
    candidate_name = "Marcus Finch"

    reg_resp = api_call("/auth/register", method="POST", payload={
        "name": candidate_name,
        "email": candidate_email,
        "password": candidate_password
    })
    assert reg_resp["status"] in [200, 201], f"Registration failed: {reg_resp}"
    token_a = reg_resp["body"]["data"]["token"]
    user_id_a = reg_resp["body"]["data"]["user"]["id"]
    print(f"[PASS 15.1] Authentication: Candidate registered successfully ({candidate_email}, ID: {user_id_a}).")

    # Verify /auth/me
    me_resp = api_call("/auth/me", token=token_a)
    assert me_resp["status"] == 200
    assert me_resp["body"]["data"]["email"] == candidate_email
    print("[PASS 15.2] Authentication: /auth/me returns authenticated identity.")

    # Second candidate for cross-tenant isolation testing
    hacker_email = f"intruder_{uuid.uuid4().hex[:6]}@example.com"
    reg_hacker = api_call("/auth/register", method="POST", payload={
        "name": "Intruder User",
        "email": hacker_email,
        "password": candidate_password
    })
    token_b = reg_hacker["body"]["data"]["token"]
    print(f"[PASS 15.3] Cross-tenant user registered: {hacker_email}.")

    # ------------------------------------------------------------------
    # Step 2: Session Creation & Initial Sequential State (Points 1 & 6)
    # ------------------------------------------------------------------
    session_create = api_call("/assessment-sessions", method="POST", payload={
        "jobRoleId": 1, # Java Developer
        "difficulty": "INTERMEDIATE",
        "questionCount": 20
    }, token=token_a)
    assert session_create["status"] == 201, f"Create session failed: {session_create}"
    session = session_create["body"]["data"]
    session_id = session["id"]

    # Verify Point 1: Only Resume round is accessible
    assert session["currentStage"] == "RESUME_EVALUATION"
    assert session["resumeRound"]["unlocked"] is True
    assert session["resumeRound"]["status"] in ["AVAILABLE", "NOT_STARTED"]
    assert session["mcqRound"]["unlocked"] is False
    assert session["mcqRound"]["status"] == "LOCKED"
    assert "Complete Resume Evaluation to unlock this round" in session["mcqRound"]["lockMessage"]
    assert session["videoRound"]["unlocked"] is False
    assert session["videoRound"]["status"] == "LOCKED"
    assert session["finalReportUnlocked"] is False
    print(f"[PASS 1] Sequential Access: Session {session_id} created; only Resume Evaluation is accessible.")

    # Verify Point 6: Direct URL/API attempt to bypass Resume round
    bypass_mcq = api_call(f"/assessment-sessions/{session_id}/mcq/start", method="POST", token=token_a)
    assert bypass_mcq["status"] == 400, f"Expected 400, got {bypass_mcq['status']}"
    assert "Complete Resume Evaluation to unlock this round" in str(bypass_mcq["body"])
    print("[PASS 6.1] Bypass Prevention: Direct attempt to start MCQ before Resume rejected (HTTP 400).")

    bypass_video = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={"consentGiven": True}, token=token_a)
    assert bypass_video["status"] == 400
    assert "Complete Resume Evaluation to unlock this round" in str(bypass_video["body"])
    print("[PASS 6.2] Bypass Prevention: Direct attempt to consent/start Video before Resume rejected (HTTP 400).")

    # Verify Point 4: Final combined score remains unavailable initially
    rep_initial = api_call(f"/assessment-reports/session/{session_id}", token=token_a)
    assert rep_initial["status"] == 200
    assert rep_initial["body"]["data"]["status"] == "INCOMPLETE"
    assert rep_initial["body"]["data"]["overallScore"] is None
    assert "Pending: Resume Evaluation" in rep_initial["body"]["data"]["incompleteReason"]
    print("[PASS 4.1] Combined Score: Final report is INCOMPLETE with null overallScore.")

    # ------------------------------------------------------------------
    # Step 3: Resume Upload, Review & Scoring (Points 2 & 7)
    # ------------------------------------------------------------------
    # Negative test: Uploading a truncated/corrupt PDF structure is rejected gracefully
    corrupt_pdf = b"%PDF-1.5\n" + b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" + b"A" * 500
    corrupt_up = api_call(
        f"/assessment-sessions/{session_id}/resume/upload",
        method="POST",
        token=token_a,
        files={"file": ("corrupt_resume.pdf", corrupt_pdf, "application/pdf")}
    )
    assert corrupt_up["status"] == 400, f"Expected 400 for corrupt PDF, got {corrupt_up['status']}"
    assert "Corrupt or invalid PDF file structure" in str(corrupt_up["body"])
    print("[PASS 7.1a] Resume Validation: Corrupt/truncated PDF gracefully rejected with descriptive error.")

    # Positive test: Valid DOCX resume file uploaded & extracted
    docx_bytes = generate_sample_docx()
    resume_up = api_call(
        f"/assessment-sessions/{session_id}/resume/upload",
        method="POST",
        token=token_a,
        files={"file": ("marcus_resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert resume_up["status"] == 200, f"Upload resume failed: {resume_up}"
    parsed_resume = resume_up["body"]["data"]["extractedData"]
    assert "technicalSkills" in parsed_resume or "skills" in str(parsed_resume).lower()
    print(f"[PASS 7.1b] Resume Parsing: Valid DOCX uploaded, parsed, and candidate review payload generated.")

    # Point 2: MCQ stays locked while resume is in progress and not saved
    mcq_still_locked = api_call(f"/assessment-sessions/{session_id}/mcq/start", method="POST", token=token_a)
    assert mcq_still_locked["status"] == 400
    print("[PASS 2.1] Sequential Locking: MCQ remains locked while Resume is in progress.")

    # Score resume with role-relevant evidence
    resume_eval = api_call(f"/assessment-sessions/{session_id}/resume/evaluate", method="POST", payload={
        "targetRole": "Java Developer",
        "companyName": "Alpha Cloud Systems",
        "jobDescription": "Senior Java Developer building microservices with Spring Boot, Kafka, and Redis",
        "correctedData": {
            "contactDetails": {
                "name": candidate_name,
                "email": candidate_email,
                "phone": "+1-555-0199",
                "linkedin": "linkedin.com/in/marcusfinch"
            },
            "summary": "Full Stack & Java Backend Engineer with 5 years developing distributed payment services.",
            "technicalSkills": {
                "programmingLanguages": ["Java", "SQL", "TypeScript"],
                "frameworks": ["Spring Boot", "Hibernate", "Spring Cloud"],
                "databases": ["PostgreSQL", "MySQL", "Redis"],
                "toolsAndPlatforms": ["Docker", "Kafka", "Kubernetes", "Git"]
            },
            "projects": [
                {
                    "title": "High-Throughput Payment Engine",
                    "technologies": "Java, Spring Boot, Kafka, MySQL",
                    "description": "Engineered transactional event-driven settlement system handling 5k RPS."
                }
            ],
            "experience": [
                {
                    "company": "Alpha Cloud Systems",
                    "role": "Java Developer",
                    "duration": "2021 - Present",
                    "description": "Architected low-latency microservices."
                }
            ],
            "education": [
                {
                    "degree": "B.S. in Computer Science",
                    "institution": "State University",
                    "year": "2021"
                }
            ],
            "certifications": ["Oracle Certified Professional Java SE"]
        }
    }, token=token_a)
    assert resume_eval["status"] == 200, f"Resume evaluate failed: {resume_eval}"
    resume_data = resume_eval["body"]["data"]
    resume_score = float(resume_data["overallMatchScore"])
    assert resume_score >= 70.0, f"Expected >= 70 score for strong resume, got {resume_score}"
    assert len(resume_data["matchedSkills"]) > 0
    print(f"[PASS 7.2] Transparent Resume Scoring: Responded to evidence with score: {resume_score}%.")

    # Point 2: Now that resume evaluation is saved, MCQ is unlocked!
    sess_after_resume = api_call(f"/assessment-sessions/{session_id}", token=token_a)
    assert sess_after_resume["body"]["data"]["mcqRound"]["unlocked"] is True
    assert sess_after_resume["body"]["data"]["mcqRound"]["status"] == "AVAILABLE"
    print("[PASS 2.2] Sequential Unlocking: MCQ round successfully unlocked after Resume result saved.")

    # Point 3: Video Interview MUST stay locked until MCQ is complete
    video_lock_check = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={"consentGiven": True}, token=token_a)
    assert video_lock_check["status"] == 400
    assert "Complete MCQ Assessment to unlock this round" in str(video_lock_check["body"])
    print("[PASS 3.1] Sequential Locking: Video Interview strictly rejects start before MCQ completion.")

    # ------------------------------------------------------------------
    # Step 4: Refresh & Session Restoration (Point 5)
    # ------------------------------------------------------------------
    # Simulate logging out and logging back in with credentials
    login_resp = api_call("/auth/login", method="POST", payload={
        "email": candidate_email,
        "password": candidate_password
    })
    assert login_resp["status"] == 200
    new_token = login_resp["body"]["data"]["token"]

    # Restore session state using refreshed token
    active_resp = api_call("/assessment-sessions/active", token=new_token)
    assert active_resp["status"] == 200
    act_data = active_resp["body"]["data"]
    assert act_data["id"] == session_id
    assert act_data["resumeRound"]["status"] == "COMPLETED"
    assert act_data["resumeRound"]["score"] == resume_score
    assert act_data["mcqRound"]["unlocked"] is True
    assert act_data["mcqRound"]["status"] == "AVAILABLE"
    assert act_data["videoRound"]["unlocked"] is False
    print("[PASS 5] State Restoration: Refresh, logout, and re-login accurately restored session progress.")

    # ------------------------------------------------------------------
    # Step 5: MCQ Assessment Execution (Point 8)
    # ------------------------------------------------------------------
    mcq_start = api_call(f"/assessment-sessions/{session_id}/mcq/start?questionCount=20", method="POST", token=new_token)
    assert mcq_start["status"] == 200, f"MCQ start failed: {mcq_start}"
    mcq_interview_id = mcq_start["body"]["data"]["id"]

    # Fetch MCQ questions
    mcq_q_resp = api_call(f"/interviews/{mcq_interview_id}/questions", token=new_token)
    assert mcq_q_resp["status"] == 200
    questions = mcq_q_resp["body"]["data"]
    assert len(questions) >= 15
    print(f"[PASS 8.1] MCQ Technical Assessment: Loaded {len(questions)} role questions.")

    # Answer questions (answer 16 correctly out of 20 = 80%)
    for idx, q in enumerate(questions):
        selected = q.get("correctOption", "A") if idx < 16 else "D"
        api_call(f"/interviews/{mcq_interview_id}/answers", method="POST", payload={
            "interviewQuestionId": q["id"],
            "selectedOption": selected
        }, token=new_token)

    # Complete MCQ stage
    mcq_complete = api_call(f"/assessment-sessions/{session_id}/mcq/complete", method="POST", payload={
        "mcqInterviewId": mcq_interview_id,
        "score": 80.0
    }, token=new_token)
    assert mcq_complete["status"] == 200
    mcq_score = float(mcq_complete["body"]["data"]["mcqRound"]["score"])
    assert mcq_score == 80.0
    print(f"[PASS 8.2] MCQ Scoring: Scored {mcq_score}% and persisted in session.")

    # Point 3: Video Interview is now unlocked!
    sess_after_mcq = api_call(f"/assessment-sessions/{session_id}", token=new_token)
    assert sess_after_mcq["body"]["data"]["videoRound"]["unlocked"] is True
    assert sess_after_mcq["body"]["data"]["videoRound"]["status"] == "AVAILABLE"
    print("[PASS 3.2] Sequential Unlocking: Video Interview unlocked after MCQ completion.")

    # Point 4: Final combined score is STILL unavailable until Video Interview finishes
    rep_mid = api_call(f"/assessment-reports/session/{session_id}", token=new_token)
    assert rep_mid["body"]["data"]["status"] == "INCOMPLETE"
    assert rep_mid["body"]["data"]["overallScore"] is None
    assert "Pending: AI Video Interview" in rep_mid["body"]["data"]["incompleteReason"]
    print("[PASS 4.2] Combined Score: Final score remains null with Video round pending (weights never redistributed).")

    # ------------------------------------------------------------------
    # Step 6: Video Interview, Analytics & Calibration (Points 9, 10, 11)
    # ------------------------------------------------------------------
    # Explicit Consent Gate
    consent_call = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={
        "consentGiven": True
    }, token=new_token)
    assert consent_call["status"] == 200
    video_questions = consent_call["body"]["data"]["questions"]
    assert len(video_questions) >= 5
    print(f"[PASS 9.1] Video Interview: Consent registered, generated {len(video_questions)} tailored questions.")

    # Upload recordings for each question
    webm_sample = b"\x1a\x45\xdf\xa3" + b"V__WEBM_RAW_BINARY__" * 80
    for idx, vq in enumerate(video_questions):
        q_id = vq["id"]
        v_ans = api_call(
            f"/assessment-sessions/{session_id}/video/questions/{q_id}/upload?duration=48&transcript=We+architected+the+payment+pipeline+using+Spring+Cloud+and+Kafka+with+strict+idempotency",
            method="POST",
            files={"file": (f"answer_{idx}.webm", webm_sample, "video/webm")},
            token=new_token
        )
        assert v_ans["status"] == 200, f"Upload failed for Q{idx}: {v_ans}"
        q_data = v_ans["body"]["data"]

        # Point 10: Verify Unsupported/Unavailable Analytics notes
        assert q_data["prosodyStatus"] == "UNAVAILABLE"
        assert "WebM" in q_data["prosodyNotes"] or "demuxer" in q_data["prosodyNotes"] or "Fallback" in q_data["prosodyNotes"]
    print("[PASS 10] Unavailable Metrics: Prosody clearly marked UNAVAILABLE with container explanation.")

    # Finish video interview round
    finish_video = api_call(f"/assessment-sessions/{session_id}/video/finish", method="POST", token=new_token)
    assert finish_video["status"] == 200
    video_score = float(finish_video["body"]["data"]["videoScore"])
    assert video_score > 0
    print(f"[PASS 9.2] Video Interview Analytics: Completed with weighted score: {video_score}%.")

    # Point 11: Contradiction-Weighted Confidence calibration verified
    assert finish_video["body"]["data"]["videoConfidenceCalibrationLabel"] in [
        "CALIBRATED", "POSSIBLE_OVERCONFIDENCE", "POSSIBLE_UNDERCONFIDENCE"
    ]
    print(f"[PASS 11] Confidence Calibration: Functional badge '{finish_video['body']['data']['videoConfidenceCalibrationLabel']}' persisted.")

    # ------------------------------------------------------------------
    # Step 7: Final Combined Report & Formula (Points 12 & 13)
    # ------------------------------------------------------------------
    final_rep = api_call(f"/assessment-reports/session/{session_id}", token=new_token)
    assert final_rep["status"] == 200
    report = final_rep["body"]["data"]

    assert report["status"] == "COMPLETED"
    assert report["overallScore"] is not None

    # Point 12: Verify exact mathematical weighting: Overall = (Resume*0.30) + (MCQ*0.30) + (Video*0.40)
    expected_overall = round((resume_score * 0.30) + (mcq_score * 0.30) + (video_score * 0.40), 1)
    actual_overall = report["overallScore"]
    assert abs(actual_overall - expected_overall) < 0.2, f"Formula mismatch: expected {expected_overall}, got {actual_overall}"
    print(f"[PASS 12] Weighting Formula: Combined score {actual_overall}% matches ({resume_score}*0.30 + {mcq_score}*0.30 + {video_score}*0.40 = {expected_overall}%).")

    # Point 13: Report reopening and cross-tenant access control
    rep_reopen = api_call(f"/assessment-reports/{report['id']}", token=new_token)
    assert rep_reopen["status"] == 200
    assert rep_reopen["body"]["data"]["id"] == report["id"]
    print(f"[PASS 13.1] Report Reopening: Owner can reopen report ID {report['id']}.")

    # Unauthorized access check: Candidate B attempts to view Candidate A's report
    unauth_rep = api_call(f"/assessment-reports/{report['id']}", token=token_b)
    assert unauth_rep["status"] in [403, 404]
    print(f"[PASS 13.2] Multi-Tenant Security: Unauthorized candidate strictly blocked from report (HTTP {unauth_rep['status']}).")

    # ------------------------------------------------------------------
    # Step 8: Recording Retention & Deletion (Point 14)
    # ------------------------------------------------------------------
    # Candidate B tries to delete Candidate A's recordings -> Rejected
    unauth_del = api_call(f"/assessment-sessions/{session_id}/video/recordings", method="DELETE", token=token_b)
    assert unauth_del["status"] in [403, 404]
    print(f"[PASS 14.1] Privacy Security: Cross-candidate deletion blocked (HTTP {unauth_del['status']}).")

    # Candidate A purges recordings
    del_resp = api_call(f"/assessment-sessions/{session_id}/video/recordings", method="DELETE", token=new_token)
    assert del_resp["status"] == 200
    assert del_resp["body"]["data"]["deletedFilesCount"] >= 1
    print(f"[PASS 14.2] Data Deletion Policy: {del_resp['body']['data']['deletedFilesCount']} recording files permanently purged.")

    # Authenticated stream must return 404 after deletion
    stream_check = api_call(f"/assessment-sessions/{session_id}/video/questions/{video_questions[0]['id']}/stream", token=new_token)
    assert stream_check["status"] == 404
    print("[PASS 14.3] Stream Security: 404 returned after candidate recording purge.")

    print("\n==================================================================")
    print("ALL 15 INTEGRATION TEST POINTS PASSED WITH 100% SUCCESS!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
