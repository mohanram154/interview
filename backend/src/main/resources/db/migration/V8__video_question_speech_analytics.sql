-- V8__video_question_speech_analytics.sql
-- Store speech characteristics and optional candidate notes / transcript

ALTER TABLE video_interview_questions
    ADD COLUMN transcript TEXT NULL,
    ADD COLUMN filler_words_count INT NULL,
    ADD COLUMN speech_clarity_level VARCHAR(50) NULL,
    ADD COLUMN sentiment_label VARCHAR(50) NULL;
