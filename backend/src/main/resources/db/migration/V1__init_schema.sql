-- V1__init_schema.sql
-- Create initial schema for Automated Candidate Interview Sentiment Analytics and Technical Competency Platform

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    google_subject VARCHAR(255) NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_CANDIDATE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_google_sub (google_subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS candidate_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    education VARCHAR(255) NULL,
    degree VARCHAR(255) NULL,
    specialization VARCHAR(255) NULL,
    skills TEXT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    preferred_role VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job_roles_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_role_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    expected_topics TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_questions_job_role FOREIGN KEY (job_role_id) REFERENCES job_roles (id) ON DELETE CASCADE,
    INDEX idx_questions_role_diff (job_role_id, difficulty, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_role_id BIGINT NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    mode VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    total_questions INT NOT NULL DEFAULT 5,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_interviews_job_role FOREIGN KEY (job_role_id) REFERENCES job_roles (id),
    INDEX idx_interviews_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interview_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_id BIGINT NOT NULL,
    question_id BIGINT NULL,
    question_text_snapshot TEXT NOT NULL,
    sequence_number INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    expected_topics TEXT NULL,
    CONSTRAINT fk_interview_questions_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_questions_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE SET NULL,
    INDEX idx_iq_interview_seq (interview_id, sequence_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_question_id BIGINT NOT NULL UNIQUE,
    answer_text MEDIUMTEXT NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    answer_status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    CONSTRAINT fk_answers_interview_question FOREIGN KEY (interview_question_id) REFERENCES interview_questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    answer_id BIGINT NOT NULL UNIQUE,
    technical_accuracy_score DOUBLE NOT NULL,
    relevance_score DOUBLE NOT NULL,
    completeness_score DOUBLE NOT NULL,
    clarity_score DOUBLE NOT NULL,
    overall_score DOUBLE NOT NULL,
    sentiment_label VARCHAR(50) NULL,
    sentiment_confidence DOUBLE NULL,
    feedback TEXT NOT NULL,
    strengths TEXT NOT NULL,
    improvements TEXT NOT NULL,
    evaluation_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evaluations_answer FOREIGN KEY (answer_id) REFERENCES answers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interview_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_id BIGINT NOT NULL UNIQUE,
    overall_score DOUBLE NOT NULL,
    technical_score DOUBLE NOT NULL,
    communication_score DOUBLE NOT NULL,
    summary TEXT NOT NULL,
    strengths TEXT NOT NULL,
    improvement_areas TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    report_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
