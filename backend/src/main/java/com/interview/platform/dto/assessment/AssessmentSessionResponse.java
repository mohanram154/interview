package com.interview.platform.dto.assessment;

import java.time.LocalDateTime;

public class AssessmentSessionResponse {

    private Long id;
    private Long userId;
    private Long jobRoleId;
    private String jobRoleName;
    private String difficulty;
    private Integer questionCount;
    private String currentStage;
    private String sessionStatus;

    // Sequential Progress
    private String progressText; // e.g. "Round 1 of 3", "Round 2 of 3", "Round 3 of 3"
    private int activeRoundNumber; // 1, 2, 3

    // Detailed Round States
    private RoundDetailDto resumeRound;
    private RoundDetailDto mcqRound;
    private RoundDetailDto videoRound;

    // Detailed Video Analytics Metrics
    private Double videoScore;
    private Double videoTechnicalScore;
    private Double videoCommunicationScore;
    private Double videoFluencyScore;
    private Double videoAnswerStructureScore;
    private Double videoConceptUsageScore;
    private String videoConfidenceCalibrationLabel;
    private String videoSentimentLabel;
    private String videoFeedback;

    // Final Outcome
    private Double finalCompositeScore;
    private String finalSummary;
    private boolean finalReportUnlocked;
    private String finalReportLockMessage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private LocalDateTime videoConsentGivenAt;
    private LocalDateTime recordingsRetentionExpiresAt;
    private LocalDateTime recordingsDeletedAt;
    private Boolean recordingsDeletedByUser;

    public static class RoundDetailDto {
        private String id; // "RESUME_EVALUATION", "MCQ_ASSESSMENT", "VIDEO_INTERVIEW"
        private String name; // "Resume Evaluation", "MCQ Technical Assessment", "AI Video Interview"
        private int roundNumber; // 1, 2, 3
        private String status; // "LOCKED", "AVAILABLE", "IN_PROGRESS", "COMPLETED", "FAILED"
        private boolean unlocked;
        private String lockMessage;
        private Double score;
        private String feedback;
        private LocalDateTime completedAt;
        private String actionLabel;
        private String actionRoute;

        public RoundDetailDto() {}

        public RoundDetailDto(String id, String name, int roundNumber, String status, boolean unlocked, String lockMessage, Double score, String feedback, LocalDateTime completedAt, String actionLabel, String actionRoute) {
            this.id = id;
            this.name = name;
            this.roundNumber = roundNumber;
            this.status = status;
            this.unlocked = unlocked;
            this.lockMessage = lockMessage;
            this.score = score;
            this.feedback = feedback;
            this.completedAt = completedAt;
            this.actionLabel = actionLabel;
            this.actionRoute = actionRoute;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public int getRoundNumber() { return roundNumber; }
        public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isUnlocked() { return unlocked; }
        public void setUnlocked(boolean unlocked) { this.unlocked = unlocked; }

        public String getLockMessage() { return lockMessage; }
        public void setLockMessage(String lockMessage) { this.lockMessage = lockMessage; }

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }

        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }

        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

        public String getActionLabel() { return actionLabel; }
        public void setActionLabel(String actionLabel) { this.actionLabel = actionLabel; }

        public String getActionRoute() { return actionRoute; }
        public void setActionRoute(String actionRoute) { this.actionRoute = actionRoute; }
    }

    public AssessmentSessionResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getJobRoleId() { return jobRoleId; }
    public void setJobRoleId(Long jobRoleId) { this.jobRoleId = jobRoleId; }

    public String getJobRoleName() { return jobRoleName; }
    public void setJobRoleName(String jobRoleName) { this.jobRoleName = jobRoleName; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public String getSessionStatus() { return sessionStatus; }
    public void setSessionStatus(String sessionStatus) { this.sessionStatus = sessionStatus; }

    public String getProgressText() { return progressText; }
    public void setProgressText(String progressText) { this.progressText = progressText; }

    public int getActiveRoundNumber() { return activeRoundNumber; }
    public void setActiveRoundNumber(int activeRoundNumber) { this.activeRoundNumber = activeRoundNumber; }

    public RoundDetailDto getResumeRound() { return resumeRound; }
    public void setResumeRound(RoundDetailDto resumeRound) { this.resumeRound = resumeRound; }

    public RoundDetailDto getMcqRound() { return mcqRound; }
    public void setMcqRound(RoundDetailDto mcqRound) { this.mcqRound = mcqRound; }

    public RoundDetailDto getVideoRound() { return videoRound; }
    public void setVideoRound(RoundDetailDto videoRound) { this.videoRound = videoRound; }

    public Double getVideoScore() { return videoScore; }
    public void setVideoScore(Double videoScore) { this.videoScore = videoScore; }

    public Double getVideoTechnicalScore() { return videoTechnicalScore; }
    public void setVideoTechnicalScore(Double videoTechnicalScore) { this.videoTechnicalScore = videoTechnicalScore; }

    public Double getVideoCommunicationScore() { return videoCommunicationScore; }
    public void setVideoCommunicationScore(Double videoCommunicationScore) { this.videoCommunicationScore = videoCommunicationScore; }

    public Double getVideoFluencyScore() { return videoFluencyScore; }
    public void setVideoFluencyScore(Double videoFluencyScore) { this.videoFluencyScore = videoFluencyScore; }

    public Double getVideoAnswerStructureScore() { return videoAnswerStructureScore; }
    public void setVideoAnswerStructureScore(Double videoAnswerStructureScore) { this.videoAnswerStructureScore = videoAnswerStructureScore; }

    public Double getVideoConceptUsageScore() { return videoConceptUsageScore; }
    public void setVideoConceptUsageScore(Double videoConceptUsageScore) { this.videoConceptUsageScore = videoConceptUsageScore; }

    public String getVideoConfidenceCalibrationLabel() { return videoConfidenceCalibrationLabel; }
    public void setVideoConfidenceCalibrationLabel(String videoConfidenceCalibrationLabel) { this.videoConfidenceCalibrationLabel = videoConfidenceCalibrationLabel; }

    public String getVideoSentimentLabel() { return videoSentimentLabel; }
    public void setVideoSentimentLabel(String videoSentimentLabel) { this.videoSentimentLabel = videoSentimentLabel; }

    public String getVideoFeedback() { return videoFeedback; }
    public void setVideoFeedback(String videoFeedback) { this.videoFeedback = videoFeedback; }

    public Double getFinalCompositeScore() { return finalCompositeScore; }
    public void setFinalCompositeScore(Double finalCompositeScore) { this.finalCompositeScore = finalCompositeScore; }

    public String getFinalSummary() { return finalSummary; }
    public void setFinalSummary(String finalSummary) { this.finalSummary = finalSummary; }

    public boolean isFinalReportUnlocked() { return finalReportUnlocked; }
    public void setFinalReportUnlocked(boolean finalReportUnlocked) { this.finalReportUnlocked = finalReportUnlocked; }

    public String getFinalReportLockMessage() { return finalReportLockMessage; }
    public void setFinalReportLockMessage(String finalReportLockMessage) { this.finalReportLockMessage = finalReportLockMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getVideoConsentGivenAt() { return videoConsentGivenAt; }
    public void setVideoConsentGivenAt(LocalDateTime videoConsentGivenAt) { this.videoConsentGivenAt = videoConsentGivenAt; }

    public LocalDateTime getRecordingsRetentionExpiresAt() { return recordingsRetentionExpiresAt; }
    public void setRecordingsRetentionExpiresAt(LocalDateTime recordingsRetentionExpiresAt) { this.recordingsRetentionExpiresAt = recordingsRetentionExpiresAt; }

    public LocalDateTime getRecordingsDeletedAt() { return recordingsDeletedAt; }
    public void setRecordingsDeletedAt(LocalDateTime recordingsDeletedAt) { this.recordingsDeletedAt = recordingsDeletedAt; }

    public Boolean getRecordingsDeletedByUser() { return recordingsDeletedByUser; }
    public void setRecordingsDeletedByUser(Boolean recordingsDeletedByUser) { this.recordingsDeletedByUser = recordingsDeletedByUser; }

    // Backward compatibility helper getters
    public String getResumeStageStatus() { return resumeRound != null ? resumeRound.getStatus() : "AVAILABLE"; }
    public Double getResumeScore() { return resumeRound != null ? resumeRound.getScore() : null; }
    public boolean isResumeUnlocked() { return resumeRound != null && resumeRound.isUnlocked(); }

    public String getMcqStageStatus() { return mcqRound != null ? mcqRound.getStatus() : "LOCKED"; }
    public Double getMcqScore() { return mcqRound != null ? mcqRound.getScore() : null; }
    public boolean isMcqUnlocked() { return mcqRound != null && mcqRound.isUnlocked(); }

    public String getVideoStageStatus() { return videoRound != null ? videoRound.getStatus() : "LOCKED"; }
    public boolean isVideoUnlocked() { return videoRound != null && videoRound.isUnlocked(); }
}
