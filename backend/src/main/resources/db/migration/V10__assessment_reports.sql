-- V10__assessment_reports.sql
-- Final combined assessment reports with three independent scorecards,
-- configurable recorded weights (Resume 30%, MCQ 30%, Video 40%),
-- overall score calculation, strengths, skill gaps, learning roadmap, and responsible-use disclaimer.

CREATE TABLE IF NOT EXISTS assessment_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_session_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    job_role_name VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED' or 'INCOMPLETE'
    
    -- Configurable recorded weights
    resume_weight DOUBLE NOT NULL DEFAULT 0.30,
    mcq_weight DOUBLE NOT NULL DEFAULT 0.30,
    video_weight DOUBLE NOT NULL DEFAULT 0.40,
    
    -- Scores (nullable if incomplete)
    overall_score DOUBLE NULL,
    resume_score DOUBLE NULL,
    mcq_score DOUBLE NULL,
    video_score DOUBLE NULL,
    
    -- Independent Scorecards JSON Data
    resume_card_json LONGTEXT NULL,
    mcq_card_json LONGTEXT NULL,
    video_card_json LONGTEXT NULL,
    
    -- Synthesized Insights
    strengths_json LONGTEXT NULL,
    skill_gaps_json LONGTEXT NULL,
    learning_roadmap_json LONGTEXT NULL,
    disclaimer TEXT NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_assessment_reports_session FOREIGN KEY (assessment_session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_assessment_reports_user ON assessment_reports(user_id);

