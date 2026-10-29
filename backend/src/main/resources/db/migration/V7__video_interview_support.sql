-- V7__video_interview_support.sql
-- Video Interview consent tracking and question recording persistence

ALTER TABLE assessment_sessions
    ADD COLUMN video_consent_given_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS video_interview_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_session_id BIGINT NOT NULL,
    sequence_number INT NOT NULL,
    question_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tailored_source VARCHAR(100) NULL,
    recording_file_path VARCHAR(255) NULL,
    recording_file_size BIGINT NULL,
    recording_duration_seconds INT NULL,
    recording_mime_type VARCHAR(100) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    uploaded_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_viq_session FOREIGN KEY (assessment_session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE,
    INDEX idx_viq_session (assessment_session_id),
    CONSTRAINT uk_viq_session_seq UNIQUE (assessment_session_id, sequence_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
