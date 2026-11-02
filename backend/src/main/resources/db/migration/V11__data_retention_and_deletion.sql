-- ==============================================================================
-- Flyway Migration V11: Video & Audio Data Retention and Candidate Deletion Policy
-- ==============================================================================

ALTER TABLE assessment_sessions
    ADD COLUMN recordings_retention_expires_at DATETIME NULL,
    ADD COLUMN recordings_deleted_at DATETIME NULL,
    ADD COLUMN recordings_deleted_by_user TINYINT(1) DEFAULT 0;

ALTER TABLE video_interview_questions
    ADD COLUMN recording_deleted_at DATETIME NULL;
