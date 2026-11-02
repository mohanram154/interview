# InterviewVerse: Data Retention and Candidate Privacy Policy

## 1. Storage and Security Architecture
- **Private Storage**: All candidate resume documents and video/audio recording binaries (`.webm`, `.mp4`, `.pdf`, `.docx`) are stored strictly outside the public web root in a dedicated server directory (`uploads/`).
- **Zero Public Access**: Recordings are never exposed via static web URLs. Access to recordings is mediated strictly through authenticated streaming endpoints (`GET /api/v1/assessment-sessions/{sessionId}/video/questions/{questionId}/stream`).
- **Resource Ownership Enforcement**: Every request verifies the candidate's authenticated identity (`UserPrincipal`). Cross-tenant access is rejected with `HTTP 403 Forbidden` or `HTTP 404 Not Found`.
- **Response Headers**: Media streaming responses enforce `Cache-Control: private, no-cache, no-store, must-revalidate` to prevent intermediate proxy or browser cache leakage.

## 2. Retention Period & Automatic Expiration
- **Default Retention Window**: Video and audio recordings are retained for **30 calendar days** from the timestamp of interview consent or completion (`app.video.retention-days: 30`).
- **Configurability**: The retention window is configurable via the `VIDEO_RETENTION_DAYS` environment variable in `application.yml`.
- **Expiration Tracking**: Each assessment session tracks `recordings_retention_expires_at` in the database.
- **Automated Purge**: When the retention window expires, physical recording binaries on disk are permanently deleted, file path references are cleared, and question statuses are transitioned to `RECORDING_EXPIRED`. Evaluated transcripts, scores, and aggregate scorecard metrics remain intact for candidate learning history.

## 3. Candidate Self-Service Deletion Rights
- **Right to Erasure (GDPR / Privacy Compliance)**: Candidates can request the immediate, permanent deletion of their video and audio recordings at any time.
- **Self-Service Endpoint**:
  ```http
  DELETE /api/v1/assessment-sessions/{sessionId}/video/recordings
  Authorization: Bearer <candidate_jwt>
  ```
- **Deletion Actions**:
  1. Verifies ownership of the assessment session.
  2. Permanently unlinks and deletes all physical media files from disk (`Files.deleteIfExists`).
  3. Clears file paths, file sizes, and MIME types in database entities.
  4. Removes the empty session folder (`uploads/video_recordings/session_{id}`).
  5. Sets `recordings_deleted_at = NOW()` and `recordings_deleted_by_user = TRUE`.
  6. Preserves candidate scorecards, transcripts, and final report for continuous learning.

## 4. Service-to-Service Authentication
- Communication between the Spring Boot backend and the Python FastAPI AI microservice uses service-level authentication via the `X-Internal-Service-Key` header (`AI_SERVICE_KEY` / `INTERNAL_SERVICE_KEY`).
- Direct unauthenticated access to internal AI service endpoints (`/internal/*`) is strictly rejected with `HTTP 401 Unauthorized`.

## 5. Ethical AI & Separation of Metrics
- **What is Analyzed**: Spoken technical depth, architectural reasoning, role-specific vocabulary, speech fluency, pause patterns, and linguistic confidence calibration.
- **What is Strictly Excluded**: Facial expressions, micro-expressions, gaze tracking, eye contact, body language, posture, physical appearance, race, gender, accent, and demographic attributes are never analyzed or factored into any score.
- **Non-Punitive Hesitation**: Pauses and filler words are treated as cognitive markers and do not penalize technical scoring.

