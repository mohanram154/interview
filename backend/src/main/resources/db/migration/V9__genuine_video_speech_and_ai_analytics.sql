-- V9__genuine_video_speech_and_ai_analytics.sql
-- Store comprehensive genuine speech analytics, prosody, technical competency, and confidence calibration metrics

ALTER TABLE video_interview_questions
    ADD COLUMN transcription_status VARCHAR(50) NULL,
    ADD COLUMN transcription_provider VARCHAR(50) NULL,
    ADD COLUMN transcription_notes TEXT NULL,
    ADD COLUMN word_timestamps LONGTEXT NULL,

    ADD COLUMN filler_word_rate DOUBLE NULL,
    ADD COLUMN pause_count INT NULL,
    ADD COLUMN avg_pause_duration DOUBLE NULL,
    ADD COLUMN longest_pause_duration DOUBLE NULL,
    ADD COLUMN repeated_words_count INT NULL,
    ADD COLUMN fluency_score DOUBLE NULL,
    ADD COLUMN fluency_notes TEXT NULL,

    ADD COLUMN prosody_status VARCHAR(50) NULL,
    ADD COLUMN pitch_variation DOUBLE NULL,
    ADD COLUMN vocal_energy_variation DOUBLE NULL,
    ADD COLUMN speech_rhythm_score DOUBLE NULL,
    ADD COLUMN prosody_notes TEXT NULL,

    ADD COLUMN speaking_wpm DOUBLE NULL,
    ADD COLUMN total_wpm DOUBLE NULL,
    ADD COLUMN sentiment_reliability VARCHAR(50) NULL,
    ADD COLUMN vocal_intensity VARCHAR(50) NULL,

    ADD COLUMN technical_score DOUBLE NULL,
    ADD COLUMN relevance_score DOUBLE NULL,
    ADD COLUMN completeness_score DOUBLE NULL,
    ADD COLUMN concept_usage_score DOUBLE NULL,
    ADD COLUMN matched_key_points LONGTEXT NULL,
    ADD COLUMN missing_key_points LONGTEXT NULL,
    ADD COLUMN evaluator_model VARCHAR(100) NULL,
    ADD COLUMN feedback TEXT NULL,
    ADD COLUMN improvement_suggestions TEXT NULL,

    ADD COLUMN linguistic_confidence_score DOUBLE NULL,
    ADD COLUMN confidence_calibration_label VARCHAR(50) NULL,
    ADD COLUMN confidence_delta DOUBLE NULL,
    ADD COLUMN confidence_calibration_explanation TEXT NULL,

    ADD COLUMN question_score DOUBLE NULL;

ALTER TABLE assessment_sessions
    ADD COLUMN video_fluency_score DOUBLE NULL,
    ADD COLUMN video_answer_structure_score DOUBLE NULL,
    ADD COLUMN video_concept_usage_score DOUBLE NULL,
    ADD COLUMN video_confidence_calibration_label VARCHAR(50) NULL;

