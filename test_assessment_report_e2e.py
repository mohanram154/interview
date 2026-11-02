import urllib.request
import urllib.error
import json
import uuid
import sys

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

def run_tests():
    print("==================================================================")
    print("FINAL COMBINED ASSESSMENT REPORT E2E VERIFICATION")
    print("==================================================================")

    # 1. Register Candidate A
    email_a = f"candidate_report_{uuid.uuid4().hex[:6]}@example.com"
    reg_resp = api_call("/auth/register", method="POST", payload={
        "name": "Alex Vance",
        "email": email_a,
        "password": "Password123!"
    })
    assert reg_resp["status"] in [200, 201], f"Register failed: {reg_resp}"
    token_a = reg_resp["body"]["data"]["token"]
    print(f"[OK] Candidate A registered: {email_a}")

    # 2. Register Candidate B (for tenant security check)
    email_b = f"candidate_other_{uuid.uuid4().hex[:6]}@example.com"
    reg_b_resp = api_call("/auth/register", method="POST", payload={
        "name": "Dana Scully",
        "email": email_b,
        "password": "Password123!"
    })
    token_b = reg_b_resp["body"]["data"]["token"]
    print(f"[OK] Candidate B registered: {email_b}")

    # 3. Create Assessment Session for Candidate A
    session_resp = api_call("/assessment-sessions", method="POST", payload={
        "jobRoleId": 1,
        "difficulty": "INTERMEDIATE",
        "questionCount": 20
    }, token=token_a)
    assert session_resp["status"] in [200, 201], f"Failed to create session: {session_resp}"
    session_id = session_resp["body"]["data"]["id"]
    print(f"[OK] Assessment Session created: ID={session_id}")

    # 4. Check Report when Session is Incomplete (Stage = RESUME)
    rep_resp_1 = api_call(f"/assessment-reports/session/{session_id}", token=token_a)
    assert rep_resp_1["status"] == 200, f"Expected 200 for report endpoint, got {rep_resp_1}"
    rep_data_1 = rep_resp_1["body"]["data"]
    assert rep_data_1["status"] == "INCOMPLETE", f"Expected INCOMPLETE, got {rep_data_1['status']}"
    assert rep_data_1["overallScore"] is None, f"Expected null overallScore, got {rep_data_1['overallScore']}"
    assert "incompleteReason" in rep_data_1 and rep_data_1["incompleteReason"] is not None
    print(f"[OK] Initial session report is INCOMPLETE with null overallScore and reason: {rep_data_1['incompleteReason']}")

    # 5. Complete Round 1: Resume Evaluation
    resume_comp = api_call(f"/assessment-sessions/{session_id}/resume/evaluate", method="POST", payload={
        "targetRole": "Java Developer",
        "companyName": "Tech Innovations Inc",
        "jobDescription": "Java Developer with Spring Boot, Microservices, and MySQL",
        "correctedData": {
            "contactDetails": {
                "name": "Alex Vance",
                "email": email_a,
                "phone": "+1-555-0199",
                "linkedin": "linkedin.com/in/alexvance",
                "github": "github.com/alexvance"
            },
            "summary": "Software Engineer with 4 years building enterprise microservices in Java and Spring Boot.",
            "technicalSkills": {
                "programmingLanguages": ["Java", "SQL", "Python"],
                "frameworks": ["Spring Boot", "Hibernate", "REST API"],
                "databases": ["MySQL", "PostgreSQL", "Redis"],
                "toolsAndPlatforms": ["Docker", "Git", "Maven"]
            },
            "projects": [
                {
                    "title": "Payment Orchestration Service",
                    "technologies": "Java, Spring Boot, MySQL, Docker",
                    "description": "Engineered distributed idempotent payments gateway."
                }
            ],
            "experience": [
                {
                    "company": "Tech Innovations Inc",
                    "role": "Java Developer",
                    "duration": "2022 - Present",
                    "description": "Developed low-latency Spring microservices."
                }
            ],
            "education": [
                {
                    "degree": "B.Tech in Computer Science",
                    "institution": "State University",
                    "year": "2022"
                }
            ],
            "certifications": ["Oracle Certified Professional Java SE"]
        }
    }, token=token_a)
    assert resume_comp["status"] == 200, f"Resume evaluate failed: {resume_comp}"
    resume_score = float(resume_comp["body"]["data"]["overallMatchScore"])
    print(f"[OK] Round 1 (Resume Evaluation) completed (Score: {resume_score}%)")

    # Check report after Round 1: Still INCOMPLETE, overallScore is null
    rep_resp_2 = api_call(f"/assessment-reports/session/{session_id}", token=token_a)
    rep_data_2 = rep_resp_2["body"]["data"]
    assert rep_data_2["status"] == "INCOMPLETE", f"Expected INCOMPLETE, got {rep_data_2['status']}"
    assert rep_data_2["overallScore"] is None, f"Expected null overallScore, got {rep_data_2['overallScore']}"
    print(f"[OK] Report after Round 1 is INCOMPLETE with null overallScore (weights never redistributed)")

    # 6. Complete Round 2: MCQ Technical Assessment
    mcq_start = api_call(f"/assessment-sessions/{session_id}/mcq/start?questionCount=20", method="POST", token=token_a)
    assert mcq_start["status"] == 200, f"MCQ start failed: {mcq_start}"
    mcq_interview_id = mcq_start["body"]["data"]["id"]
    print(f"[OK] Round 2 (MCQ Technical Assessment) started with 20 questions (Interview ID: {mcq_interview_id})")

    mcq_comp = api_call(f"/assessment-sessions/{session_id}/mcq/complete", method="POST", payload={
        "mcqInterviewId": mcq_interview_id,
        "score": 90.0
    }, token=token_a)
    assert mcq_comp["status"] == 200, f"MCQ complete failed: {mcq_comp}"
    mcq_score = float(mcq_comp["body"]["data"]["mcqRound"]["score"])
    print(f"[OK] Round 2 (MCQ Technical Assessment) completed with score: {mcq_score}%")

    # Check report after Round 2: Still INCOMPLETE, overallScore is null
    rep_resp_3 = api_call(f"/assessment-reports/session/{session_id}", token=token_a)
    rep_data_3 = rep_resp_3["body"]["data"]
    assert rep_data_3["status"] == "INCOMPLETE", f"Expected INCOMPLETE, got {rep_data_3['status']}"
    assert rep_data_3["overallScore"] is None, f"Expected null overallScore, got {rep_data_3['overallScore']}"
    print(f"[OK] Report after Round 2 is INCOMPLETE with null overallScore (Video pending)")

    # 7. Complete Round 3: AI Video Interview
    consent_resp = api_call(f"/assessment-sessions/{session_id}/video/consent", method="POST", payload={"consentGiven": True}, token=token_a)
    assert consent_resp["status"] == 200, f"Video consent failed: {consent_resp}"
    video_questions = consent_resp["body"]["data"]["questions"]
    print(f"[OK] Video interview unlocked & consented. {len(video_questions)} questions generated.")

    dummy_webm_bytes = b"G__WEBM_HEADER__TESTVIDEO__" * 80
    for idx, vq in enumerate(video_questions):
        q_id = vq["id"]
        v_ans = api_call(
            f"/assessment-sessions/{session_id}/video/questions/{q_id}/upload?duration=50&transcript=I+architected+the+distributed+microservice+using+clean+hexagonal+architecture+and+event+sourcing",
            method="POST",
            files={"file": (f"answer_{idx}.webm", dummy_webm_bytes, "video/webm")},
            token=token_a
        )
        assert v_ans["status"] == 200, f"Answer upload failed for Q{idx}: {v_ans}"
    print(f"[OK] All {len(video_questions)} video answers recorded and uploaded")

    finish_video = api_call(f"/assessment-sessions/{session_id}/video/finish", method="POST", token=token_a)
    assert finish_video["status"] == 200, f"Video finish failed: {finish_video}"
    video_score = float(finish_video["body"]["data"]["videoScore"])
    print(f"[OK] Video interview completed with score: {video_score}%")

    # 8. Check Final Assessment Report when All 3 Rounds are Complete
    final_rep = api_call(f"/assessment-reports/session/{session_id}", token=token_a)
    assert final_rep["status"] == 200, f"Final report failed: {final_rep}"
    report = final_rep["body"]["data"]

    print("\n--- REPORT DATA VERIFICATION ---")
    assert report["status"] == "COMPLETED", f"Expected COMPLETED, got {report['status']}"
    print(f"[OK] Report Status: {report['status']}")

    # Verify Weights and Formula
    assert report["resumeWeight"] == 0.30, f"Expected 0.30, got {report['resumeWeight']}"
    assert report["mcqWeight"] == 0.30, f"Expected 0.30, got {report['mcqWeight']}"
    assert report["videoWeight"] == 0.40, f"Expected 0.40, got {report['videoWeight']}"
    assert "0.30" in report["formulaText"] and "0.40" in report["formulaText"]
    print(f"[OK] Recorded weights: Resume={report['resumeWeight']}, MCQ={report['mcqWeight']}, Video={report['videoWeight']}")
    print(f"[OK] Formula: {report['formulaText']}")

    # Verify Mathematical Calculation of Overall Combined Score
    expected_overall = round((resume_score * 0.30) + (mcq_score * 0.30) + (video_score * 0.40), 1)
    assert abs(report["overallScore"] - expected_overall) < 0.2, f"Expected {expected_overall}, got {report['overallScore']}"
    print(f"[OK] Overall Score: {report['overallScore']} (Formula check: {resume_score}*0.30 + {mcq_score}*0.30 + {video_score}*0.40 = {expected_overall})")

    # Verify Resume Scorecard
    rc = report["resumeCard"]
    assert rc is not None
    assert abs(rc["score"] - resume_score) < 0.1
    assert rc["targetRole"] == "Java Developer"
    assert "scoringBreakdown" in rc
    print(f"[OK] Resume Scorecard verified (breakdown, score, target role: {rc['targetRole']})")

    # Verify MCQ Scorecard
    mc = report["mcqCard"]
    assert mc is not None
    assert abs(mc["percentage"] - mcq_score) < 0.1
    assert mc["totalQuestionsCount"] >= 15
    assert "topicWisePerformance" in mc
    assert "questions" in mc
    print(f"[OK] MCQ Scorecard verified (total={mc['totalQuestionsCount']}, correct={mc['correctAnswersCount']}, incorrect={mc['incorrectAnswersCount']}, unanswered={mc['unansweredCount']})")

    # Verify Video Scorecard
    vc = report["videoCard"]
    assert vc is not None
    assert abs(vc["score"] - video_score) < 0.1
    assert "technicalAnswerQualityBreakdown" in vc
    assert "hesitationAndFluencyMetrics" in vc
    assert "prosodyAndMeasurements" in vc
    assert "speechRate" in vc
    assert "confidenceCalibration" in vc
    assert "questions" in vc and len(vc["questions"]) == len(video_questions)
    print(f"[OK] Video Scorecard verified (5-dimension quality, hesitation, prosody, confidence calibration)")

    # Verify Synthesized Insights & Personalized Learning Roadmap
    assert len(report["overallStrengths"]) > 0
    assert len(report["overallSkillGaps"]) > 0
    assert len(report["learningRoadmap"]) == 3
    print(f"[OK] Synthesized strengths ({len(report['overallStrengths'])} items) and skill gaps ({len(report['overallSkillGaps'])} items)")
    print(f"[OK] 3-Phase Personalized Learning Roadmap: {[p['phase'] for p in report['learningRoadmap']]}")

    # Verify Responsible AI Disclaimer
    assert report["disclaimer"] is not None
    assert "decision-support" in report["disclaimer"]
    print(f"[OK] Responsible AI Disclaimer present: {report['disclaimer'][:60]}...")

    # 9. Verify Duplicate Prevention
    rep_dup = api_call(f"/assessment-reports/session/{session_id}", token=token_a)
    assert rep_dup["status"] == 200
    assert rep_dup["body"]["data"]["id"] == report["id"], "Calling report endpoint again must return identical persisted report ID"
    print(f"[OK] Duplicate prevention confirmed: Re-fetching returns same report ID ({report['id']}) without creating duplicates")

    # 10. Verify GET by ID and Ownership Enforcement
    rep_by_id = api_call(f"/assessment-reports/{report['id']}", token=token_a)
    assert rep_by_id["status"] == 200
    assert rep_by_id["body"]["data"]["id"] == report["id"]
    print(f"[OK] Report fetched successfully by ID")

    # Candidate B attempts to access Candidate A's report -> Must be rejected (403 Forbidden)
    rep_unauth = api_call(f"/assessment-reports/{report['id']}", token=token_b)
    assert rep_unauth["status"] in [403, 404], f"Expected 403/404 for unauthorized report access, got {rep_unauth['status']}"
    print(f"[OK] Security ownership enforced: Candidate B cannot access Candidate A's report (HTTP {rep_unauth['status']})")

    # 11. Verify Candidate Report History
    history_resp = api_call("/assessment-reports", token=token_a)
    assert history_resp["status"] == 200
    history_items = history_resp["body"]["data"]
    assert len(history_items) >= 1
    found = any(item["id"] == report["id"] for item in history_items)
    assert found, "Saved report not found in candidate's report history list"
    print(f"[OK] Report history verified: Found report {report['id']} in candidate's history list ({len(history_items)} total reports)")

    # 12. Verify Compatibility with Session Endpoint /assessment-sessions/{id}/report
    compat_rep = api_call(f"/assessment-sessions/{session_id}/report", token=token_a)
    assert compat_rep["status"] == 200
    assert compat_rep["body"]["data"]["id"] == report["id"]
    print(f"[OK] Session controller endpoint /assessment-sessions/{session_id}/report returns identical report")

    # 13. Verify FastAPI Service Authentication Protection
    print("\n--- SERVICE AUTHENTICATION VERIFICATION ---")
    req_unauth = urllib.request.Request("http://localhost:8000/internal/evaluate", data=b'{"questionText":"Q","answerText":"A"}', headers={"Content-Type": "application/json"}, method="POST")
    try:
        urllib.request.urlopen(req_unauth)
        assert False, "Direct unauthenticated call to FastAPI /internal/evaluate should fail with 401!"
    except urllib.error.HTTPError as he:
        assert he.code == 401, f"Expected 401 Unauthorized, got {he.code}"
        print("[OK] FastAPI microservice strictly rejects unauthenticated internal requests (HTTP 401)")

    # 14. Verify Video Container Magic Bytes Validation
    print("\n--- BINARY FILE VALIDATION VERIFICATION ---")
    first_q_id = video_questions[0]["id"]
    corrupt_bytes = b"\x00\x01\x02\x03\x04\x05\x06\x07\x08" # Non-video bytes
    invalid_up = api_call(
        f"/assessment-sessions/{session_id}/video/questions/{first_q_id}/upload?duration=30",
        method="POST",
        files={"file": ("fake.webm", corrupt_bytes, "video/webm")},
        token=token_a
    )
    assert invalid_up["status"] == 400, f"Expected 400 for corrupt container header, got {invalid_up['status']}"
    assert "Invalid video container format" in str(invalid_up["body"])
    print("[OK] Video upload strictly validates binary container magic bytes (HTTP 400 on fake header)")

    # 15. Verify Candidate Recording Deletion & Ownership Security
    print("\n--- CANDIDATE RECORDING DELETION & RETENTION POLICY ---")
    # Candidate B tries to delete Candidate A's recordings -> Forbidden (403)
    del_unauth = api_call(f"/assessment-sessions/{session_id}/video/recordings", method="DELETE", token=token_b)
    assert del_unauth["status"] in [403, 404], f"Expected 403/404 for unauthorized deletion, got {del_unauth['status']}"
    print(f"[OK] Cross-candidate recording deletion strictly forbidden (HTTP {del_unauth['status']})")

    # Candidate A requests permanent deletion of their recordings
    del_auth = api_call(f"/assessment-sessions/{session_id}/video/recordings", method="DELETE", token=token_a)
    assert del_auth["status"] == 200, f"Candidate recording deletion failed: {del_auth}"
    del_data = del_auth["body"]["data"]
    assert del_data["deletedFilesCount"] >= 1, "Expected deleted files count >= 1"
    assert "permanently purged" in del_data["message"]
    print(f"[OK] Candidate recordings permanently purged ({del_data['deletedFilesCount']} files deleted, timestamp: {del_data['recordingsDeletedAt']})")

    # Streaming after deletion must return 404
    stream_after_del = api_call(f"/assessment-sessions/{session_id}/video/questions/{first_q_id}/stream", token=token_a)
    assert stream_after_del["status"] == 404, f"Expected 404 after deletion, got {stream_after_del['status']}"
    print("[OK] Authenticated streaming correctly returns 404 after candidate requested deletion")

    # Idempotent second deletion
    del_again = api_call(f"/assessment-sessions/{session_id}/video/recordings", method="DELETE", token=token_a)
    assert del_again["status"] == 200
    assert del_again["body"]["data"]["deletedFilesCount"] == 0
    print("[OK] Subsequent recording deletion requests are safe and idempotent (0 files to delete)")

    print("\n==================================================================")
    print("ALL HARDENING & COMBINED ASSESSMENT REPORT E2E TESTS PASSED!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
