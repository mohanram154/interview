package com.interview.platform.dto.report;

public class ReportHistoryItemDto {

    private Long id;
    private Long assessmentSessionId;
    private String jobRoleName;
    private String difficulty;
    private String status;
    private Double overallScore;
    private Double resumeScore;
    private Double mcqScore;
    private Double videoScore;
    private String createdAt;

    public ReportHistoryItemDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAssessmentSessionId() { return assessmentSessionId; }
    public void setAssessmentSessionId(Long assessmentSessionId) { this.assessmentSessionId = assessmentSessionId; }

    public String getJobRoleName() { return jobRoleName; }
    public void setJobRoleName(String jobRoleName) { this.jobRoleName = jobRoleName; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }

    public Double getResumeScore() { return resumeScore; }
    public void setResumeScore(Double resumeScore) { this.resumeScore = resumeScore; }

    public Double getMcqScore() { return mcqScore; }
    public void setMcqScore(Double mcqScore) { this.mcqScore = mcqScore; }

    public Double getVideoScore() { return videoScore; }
    public void setVideoScore(Double videoScore) { this.videoScore = videoScore; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}

