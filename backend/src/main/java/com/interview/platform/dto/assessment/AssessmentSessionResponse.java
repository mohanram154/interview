package com.interview.platform.dto.assessment;

import java.time.LocalDateTime;

public class AssessmentSessionResponse {

    private Long id;
    private Long userId;
    private Long jobRoleId;
    private String jobRoleName;
    private String difficulty;
    private String currentStage;
    private String sessionStatus;

    // Stage 1: Resume
    private String resumeStageStatus;
    private Double resumeScore;
    private String resumeFilename;
    private Double resumeSkillsMatchScore;
    private Double resumeExperienceScore;
    private String resumeFeedback;
    private LocalDateTime resumeCompletedAt;
    private boolean resumeUnlocked;

    // Stage 2: MCQ
    private String mcqStageStatus;
    private Long mcqInterviewId;
    private Double mcqScore;
    private LocalDateTime mcqCompletedAt;
    private boolean mcqUnlocked;

    // Stage 3: Video
    private String videoStageStatus;
    private Double videoScore;
    private Double videoTechnicalScore;
    private Double videoCommunicationScore;
    private String videoSentimentLabel;
    private String videoFeedback;
    private LocalDateTime videoCompletedAt;
    private boolean videoUnlocked;

    // Final Outcome
    private Double finalCompositeScore;
    private String finalSummary;
    private boolean finalReportUnlocked;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

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

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public String getSessionStatus() { return sessionStatus; }
    public void setSessionStatus(String sessionStatus) { this.sessionStatus = sessionStatus; }

    public String getResumeStageStatus() { return resumeStageStatus; }
    public void setResumeStageStatus(String resumeStageStatus) { this.resumeStageStatus = resumeStageStatus; }

    public Double getResumeScore() { return resumeScore; }
    public void setResumeScore(Double resumeScore) { this.resumeScore = resumeScore; }

    public String getResumeFilename() { return resumeFilename; }
    public void setResumeFilename(String resumeFilename) { this.resumeFilename = resumeFilename; }

    public Double getResumeSkillsMatchScore() { return resumeSkillsMatchScore; }
    public void setResumeSkillsMatchScore(Double resumeSkillsMatchScore) { this.resumeSkillsMatchScore = resumeSkillsMatchScore; }

    public Double getResumeExperienceScore() { return resumeExperienceScore; }
    public void setResumeExperienceScore(Double resumeExperienceScore) { this.resumeExperienceScore = resumeExperienceScore; }

    public String getResumeFeedback() { return resumeFeedback; }
    public void setResumeFeedback(String resumeFeedback) { this.resumeFeedback = resumeFeedback; }

    public LocalDateTime getResumeCompletedAt() { return resumeCompletedAt; }
    public void setResumeCompletedAt(LocalDateTime resumeCompletedAt) { this.resumeCompletedAt = resumeCompletedAt; }

    public boolean isResumeUnlocked() { return resumeUnlocked; }
    public void setResumeUnlocked(boolean resumeUnlocked) { this.resumeUnlocked = resumeUnlocked; }

    public String getMcqStageStatus() { return mcqStageStatus; }
    public void setMcqStageStatus(String mcqStageStatus) { this.mcqStageStatus = mcqStageStatus; }

    public Long getMcqInterviewId() { return mcqInterviewId; }
    public void setMcqInterviewId(Long mcqInterviewId) { this.mcqInterviewId = mcqInterviewId; }

    public Double getMcqScore() { return mcqScore; }
    public void setMcqScore(Double mcqScore) { this.mcqScore = mcqScore; }

    public LocalDateTime getMcqCompletedAt() { return mcqCompletedAt; }
    public void setMcqCompletedAt(LocalDateTime mcqCompletedAt) { this.mcqCompletedAt = mcqCompletedAt; }

    public boolean isMcqUnlocked() { return mcqUnlocked; }
    public void setMcqUnlocked(boolean mcqUnlocked) { this.mcqUnlocked = mcqUnlocked; }

    public String getVideoStageStatus() { return videoStageStatus; }
    public void setVideoStageStatus(String videoStageStatus) { this.videoStageStatus = videoStageStatus; }

    public Double getVideoScore() { return videoScore; }
    public void setVideoScore(Double videoScore) { this.videoScore = videoScore; }

    public Double getVideoTechnicalScore() { return videoTechnicalScore; }
    public void setVideoTechnicalScore(Double videoTechnicalScore) { this.videoTechnicalScore = videoTechnicalScore; }

    public Double getVideoCommunicationScore() { return videoCommunicationScore; }
    public void setVideoCommunicationScore(Double videoCommunicationScore) { this.videoCommunicationScore = videoCommunicationScore; }

    public String getVideoSentimentLabel() { return videoSentimentLabel; }
    public void setVideoSentimentLabel(String videoSentimentLabel) { this.videoSentimentLabel = videoSentimentLabel; }

    public String getVideoFeedback() { return videoFeedback; }
    public void setVideoFeedback(String videoFeedback) { this.videoFeedback = videoFeedback; }

    public LocalDateTime getVideoCompletedAt() { return videoCompletedAt; }
    public void setVideoCompletedAt(LocalDateTime videoCompletedAt) { this.videoCompletedAt = videoCompletedAt; }

    public boolean isVideoUnlocked() { return videoUnlocked; }
    public void setVideoUnlocked(boolean videoUnlocked) { this.videoUnlocked = videoUnlocked; }

    public Double getFinalCompositeScore() { return finalCompositeScore; }
    public void setFinalCompositeScore(Double finalCompositeScore) { this.finalCompositeScore = finalCompositeScore; }

    public String getFinalSummary() { return finalSummary; }
    public void setFinalSummary(String finalSummary) { this.finalSummary = finalSummary; }

    public boolean isFinalReportUnlocked() { return finalReportUnlocked; }
    public void setFinalReportUnlocked(boolean finalReportUnlocked) { this.finalReportUnlocked = finalReportUnlocked; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
