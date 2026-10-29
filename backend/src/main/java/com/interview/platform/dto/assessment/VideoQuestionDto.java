package com.interview.platform.dto.assessment;

import java.time.LocalDateTime;

public class VideoQuestionDto {

    private Long id;
    private Long assessmentSessionId;
    private int sequenceNumber;
    private String questionText;
    private String category;
    private String tailoredSource;
    private String status;
    private boolean hasRecording;
    private Integer recordingDurationSeconds;
    private Long recordingFileSize;
    private String recordingMimeType;
    private String transcript;
    private Integer fillerWordsCount;
    private String speechClarityLevel;
    private String sentimentLabel;
    private LocalDateTime uploadedAt;

    public VideoQuestionDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAssessmentSessionId() {
        return assessmentSessionId;
    }

    public void setAssessmentSessionId(Long assessmentSessionId) {
        this.assessmentSessionId = assessmentSessionId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isHasRecording() {
        return hasRecording;
    }

    public void setHasRecording(boolean hasRecording) {
        this.hasRecording = hasRecording;
    }

    public Integer getRecordingDurationSeconds() {
        return recordingDurationSeconds;
    }

    public void setRecordingDurationSeconds(Integer recordingDurationSeconds) {
        this.recordingDurationSeconds = recordingDurationSeconds;
    }

    public Long getRecordingFileSize() {
        return recordingFileSize;
    }

    public void setRecordingFileSize(Long recordingFileSize) {
        this.recordingFileSize = recordingFileSize;
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

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}

