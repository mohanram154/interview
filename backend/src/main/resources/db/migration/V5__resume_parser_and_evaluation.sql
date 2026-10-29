-- V5__resume_parser_and_evaluation.sql
-- Create resume evaluations table and ensure all 8 target roles are present

CREATE TABLE IF NOT EXISTS resume_evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assessment_session_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    company_name VARCHAR(150) NULL,
    job_description TEXT NULL,
    is_custom_job_description BOOLEAN NOT NULL DEFAULT FALSE,
    resume_filename VARCHAR(255) NOT NULL,
    resume_file_size BIGINT NOT NULL,
    resume_file_type VARCHAR(50) NOT NULL,
    
    -- Extracted and candidate-reviewed JSON data
    extracted_data LONGTEXT NULL,
    corrected_data LONGTEXT NULL,
    
    -- Transparent score breakdown out of 100 with default weights:
    -- Technical skill match: 30%
    -- Relevant project experience: 25%
    -- Internship/work relevance: 15%
    -- Education and certifications relevance: 10%
    -- Evidence of practical implementation: 10%
    -- Alignment with role requirements: 10%
    overall_match_score DOUBLE NOT NULL DEFAULT 0.0,
    technical_skill_score DOUBLE NOT NULL DEFAULT 0.0,
    project_experience_score DOUBLE NOT NULL DEFAULT 0.0,
    internship_work_score DOUBLE NOT NULL DEFAULT 0.0,
    education_cert_score DOUBLE NOT NULL DEFAULT 0.0,
    practical_evidence_score DOUBLE NOT NULL DEFAULT 0.0,
    role_alignment_score DOUBLE NOT NULL DEFAULT 0.0,
    
    -- Detailed evaluation arrays and explanations
    matched_skills LONGTEXT NULL,
    missing_skills LONGTEXT NULL,
    relevant_projects LONGTEXT NULL,
    strengths LONGTEXT NULL,
    requirements_not_evidenced LONGTEXT NULL,
    improvement_suggestions LONGTEXT NULL,
    score_explanations LONGTEXT NULL,
    evaluation_benchmark VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_resume_eval_session FOREIGN KEY (assessment_session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_resume_eval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_resume_eval_user (user_id),
    INDEX idx_resume_eval_session (assessment_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure all 8 target roles are populated in job_roles
INSERT INTO job_roles (id, name, description, active)
VALUES 
    (7, 'Software Developer', 'Core software engineering, algorithms, design patterns, clean code, data structures, and debugging.', TRUE),
    (8, 'Data Analyst', 'Data wrangling, SQL querying, statistical data analysis, Python/Pandas, visualization, and business intelligence.', TRUE),
    (9, 'AI/ML Engineer', 'Machine learning algorithms, model training, feature engineering, neural networks, PyTorch/TensorFlow, and model deployment.', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), active=VALUES(active);

