package com.interview.platform.dto.report;

import java.util.List;
import java.util.Map;

public class AssessmentReportResponse {

    private Long id;
    private Long assessmentSessionId;
    private String jobRoleName;
    private String difficulty;
    private String status; // COMPLETED, INCOMPLETE
    private String incompleteReason;
    private String createdAt;
    private String updatedAt;

    // Weights
    private Double resumeWeight;
    private Double mcqWeight;
    private Double videoWeight;
    private String formulaText;

    // Scores
    private Double overallScore;
    private Double resumeScore;
    private Double mcqScore;
    private Double videoScore;

    // Independent Scorecards
    private Map<String, Object> resumeCard;
    private Map<String, Object> mcqCard;
    private Map<String, Object> videoCard;

    // Synthesized Insights
    private List<String> overallStrengths;
    private List<String> overallSkillGaps;
    private List<Map<String, Object>> learningRoadmap;
    private String disclaimer;

    public AssessmentReportResponse() {}

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

    public String getIncompleteReason() { return incompleteReason; }
    public void setIncompleteReason(String incompleteReason) { this.incompleteReason = incompleteReason; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public Double getResumeWeight() { return resumeWeight; }
    public void setResumeWeight(Double resumeWeight) { this.resumeWeight = resumeWeight; }

    public Double getMcqWeight() { return mcqWeight; }
    public void setMcqWeight(Double mcqWeight) { this.mcqWeight = mcqWeight; }

    public Double getVideoWeight() { return videoWeight; }
    public void setVideoWeight(Double videoWeight) { this.videoWeight = videoWeight; }

    public String getFormulaText() { return formulaText; }
    public void setFormulaText(String formulaText) { this.formulaText = formulaText; }

    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }

    public Double getResumeScore() { return resumeScore; }
    public void setResumeScore(Double resumeScore) { this.resumeScore = resumeScore; }

    public Double getMcqScore() { return mcqScore; }
    public void setMcqScore(Double mcqScore) { this.mcqScore = mcqScore; }

    public Double getVideoScore() { return videoScore; }
    public void setVideoScore(Double videoScore) { this.videoScore = videoScore; }

    public Map<String, Object> getResumeCard() { return resumeCard; }
    public void setResumeCard(Map<String, Object> resumeCard) { this.resumeCard = resumeCard; }

    public Map<String, Object> getMcqCard() { return mcqCard; }
    public void setMcqCard(Map<String, Object> mcqCard) { this.mcqCard = mcqCard; }

    public Map<String, Object> getVideoCard() { return videoCard; }
    public void setVideoCard(Map<String, Object> videoCard) { this.videoCard = videoCard; }

    public List<String> getOverallStrengths() { return overallStrengths; }
    public void setOverallStrengths(List<String> overallStrengths) { this.overallStrengths = overallStrengths; }

    public List<String> getOverallSkillGaps() { return overallSkillGaps; }
    public void setOverallSkillGaps(List<String> overallSkillGaps) { this.overallSkillGaps = overallSkillGaps; }

    public List<Map<String, Object>> getLearningRoadmap() { return learningRoadmap; }
    public void setLearningRoadmap(List<Map<String, Object>> learningRoadmap) { this.learningRoadmap = learningRoadmap; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}

