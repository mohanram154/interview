package com.interview.platform.dto.assessment;

import java.time.LocalDateTime;
import java.util.List;

public class VideoInterviewStatusResponse {

    private Long sessionId;
    private String jobRoleName;
    private String difficulty;
    private String stageStatus;
    private boolean consentGiven;
    private LocalDateTime consentGivenAt;
    private int totalQuestions;
    private int uploadedQuestions;
    private boolean allQuestionsUploaded;
    private List<VideoQuestionDto> questions;

    public VideoInterviewStatusResponse() {}

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getJobRoleName() {
        return jobRoleName;
    }

    public void setJobRoleName(String jobRoleName) {
        this.jobRoleName = jobRoleName;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getStageStatus() {
        return stageStatus;
    }

    public void setStageStatus(String stageStatus) {
        this.stageStatus = stageStatus;
    }

    public boolean isConsentGiven() {
        return consentGiven;
    }

    public void setConsentGiven(boolean consentGiven) {
        this.consentGiven = consentGiven;
    }

    public LocalDateTime getConsentGivenAt() {
        return consentGivenAt;
    }

    public void setConsentGivenAt(LocalDateTime consentGivenAt) {
        this.consentGivenAt = consentGivenAt;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public int getUploadedQuestions() {
        return uploadedQuestions;
    }

    public void setUploadedQuestions(int uploadedQuestions) {
        this.uploadedQuestions = uploadedQuestions;
    }

    public boolean isAllQuestionsUploaded() {
        return allQuestionsUploaded;
    }

    public void setAllQuestionsUploaded(boolean allQuestionsUploaded) {
        this.allQuestionsUploaded = allQuestionsUploaded;
    }

    public List<VideoQuestionDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<VideoQuestionDto> questions) {
        this.questions = questions;
    }
}

