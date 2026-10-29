-- V4__assessment_session_foundation.sql
-- Create shared assessment session foundation for sequential interview workflow:
-- Login -> Role Selection -> Resume Evaluation -> MCQ Assessment -> AI Video Interview -> Final Combined Report

CREATE TABLE IF NOT EXISTS assessment_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_role_id BIGINT NOT NULL,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'INTERMEDIATE',
    current_stage VARCHAR(50) NOT NULL DEFAULT 'RESUME_EVALUATION',
    session_status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',

    -- Stage 1: Resume Evaluation
    resume_stage_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    resume_score DOUBLE NULL,
    resume_filename VARCHAR(255) NULL,
    resume_skills_match_score DOUBLE NULL,
    resume_experience_score DOUBLE NULL,
    resume_feedback TEXT NULL,
    resume_completed_at TIMESTAMP NULL,

    -- Stage 2: Multiple Choice Questions (MCQ) Round (Locked initially)
    mcq_stage_status VARCHAR(50) NOT NULL DEFAULT 'LOCKED',
    mcq_interview_id BIGINT NULL,
    mcq_score DOUBLE NULL,
    mcq_completed_at TIMESTAMP NULL,

    -- Stage 3: AI Video Interview Round (Locked initially)
    video_stage_status VARCHAR(50) NOT NULL DEFAULT 'LOCKED',
    video_score DOUBLE NULL,
    video_technical_score DOUBLE NULL,
    video_communication_score DOUBLE NULL,
    video_sentiment_label VARCHAR(50) NULL,
    video_feedback TEXT NULL,
    video_completed_at TIMESTAMP NULL,

    -- Final Combined Outcome
    final_composite_score DOUBLE NULL,
    final_summary TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    CONSTRAINT fk_assessment_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_sessions_job_role FOREIGN KEY (job_role_id) REFERENCES job_roles (id),
    CONSTRAINT fk_assessment_sessions_mcq FOREIGN KEY (mcq_interview_id) REFERENCES interviews (id) ON DELETE SET NULL,
    INDEX idx_assessment_sessions_user (user_id, session_status),
    INDEX idx_assessment_sessions_stage (current_stage, session_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

