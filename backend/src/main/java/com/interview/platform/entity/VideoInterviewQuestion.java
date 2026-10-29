package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_interview_questions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assessment_session_id", "sequence_number"})
})
public class VideoInterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_session_id", nullable = false)
    private AssessmentSession assessmentSession;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "tailored_source", length = 100)
    private String tailoredSource;

    @Column(name = "recording_file_path", length = 255)
    private String recordingFilePath;

    @Column(name = "recording_file_size")
    private Long recordingFileSize;

    @Column(name = "recording_duration_seconds")
    private Integer recordingDurationSeconds;

    @Column(name = "recording_mime_type", length = 100)
    private String recordingMimeType;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "filler_words_count")
    private Integer fillerWordsCount;

    @Column(name = "speech_clarity_level", length = 50)
    private String speechClarityLevel;

    @Column(name = "sentiment_label", length = 50)
    private String sentimentLabel;

    @Column(nullable = false, length = 50)
    private String status = "PENDING";

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public VideoInterviewQuestion() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AssessmentSession getAssessmentSession() {
        return assessmentSession;
    }

    public void setAssessmentSession(AssessmentSession assessmentSession) {
        this.assessmentSession = assessmentSession;
    }

    public int getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(int sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTailoredSource() {
        return tailoredSource;
    }

    public void setTailoredSource(String tailoredSource) {
        this.tailoredSource = tailoredSource;
    }

    public String getRecordingFilePath() {
        return recordingFilePath;
    }

    public void setRecordingFilePath(String recordingFilePath) {
        this.recordingFilePath = recordingFilePath;
    }

    public Long getRecordingFileSize() {
        return recordingFileSize;
    }

    public void setRecordingFileSize(Long recordingFileSize) {
        this.recordingFileSize = recordingFileSize;
    }

    public Integer getRecordingDurationSeconds() {
        return recordingDurationSeconds;
    }

    public void setRecordingDurationSeconds(Integer recordingDurationSeconds) {
        this.recordingDurationSeconds = recordingDurationSeconds;
    }

    public String getRecordingMimeType() {
        return recordingMimeType;
    }

    public void setRecordingMimeType(String recordingMimeType) {
        this.recordingMimeType = recordingMimeType;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public Integer getFillerWordsCount() {
        return fillerWordsCount;
    }

    public void setFillerWordsCount(Integer fillerWordsCount) {
        this.fillerWordsCount = fillerWordsCount;
    }

    public String getSpeechClarityLevel() {
        return speechClarityLevel;
    }

    public void setSpeechClarityLevel(String speechClarityLevel) {
        this.speechClarityLevel = speechClarityLevel;
    }

    public String getSentimentLabel() {
        return sentimentLabel;
    }

    public void setSentimentLabel(String sentimentLabel) {
        this.sentimentLabel = sentimentLabel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

