package com.interview.platform.dto.interview;

import java.time.LocalDateTime;
import java.util.List;

public class ReportResponse {
    private Long id;
    private Long interviewId;
    private String jobRoleName;
    private String difficulty;
    private String mode;
    private double overallScore;
    private double technicalScore;
    private double communicationScore;
    private String summary;
    private List<String> strengths;
    private List<String> improvementAreas;
    private List<String> recommendations;
    private String reportStatus;
    private LocalDateTime createdAt;
    private List<InterviewQuestionResponse> questions;

    public ReportResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }

    public String getJobRoleName() { return jobRoleName; }
    public void setJobRoleName(String jobRoleName) { this.jobRoleName = jobRoleName; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public double getOverallScore() { return overallScore; }
    public void setOverallScore(double overallScore) { this.overallScore = overallScore; }

    public double getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(double technicalScore) { this.technicalScore = technicalScore; }

    public double getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(double communicationScore) { this.communicationScore = communicationScore; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }

    public List<String> getImprovementAreas() { return improvementAreas; }
    public void setImprovementAreas(List<String> improvementAreas) { this.improvementAreas = improvementAreas; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public String getReportStatus() { return reportStatus; }
    public void setReportStatus(String reportStatus) { this.reportStatus = reportStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<InterviewQuestionResponse> getQuestions() { return questions; }
    public void setQuestions(List<InterviewQuestionResponse> questions) { this.questions = questions; }
}
