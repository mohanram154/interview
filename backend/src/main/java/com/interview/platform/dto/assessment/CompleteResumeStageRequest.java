package com.interview.platform.dto.assessment;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class CompleteResumeStageRequest {

    @NotNull(message = "Resume score is required")
    @DecimalMin(value = "0.0", message = "Score must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Score cannot exceed 100.0")
    private Double score;

    private Double skillsMatchScore;
    private Double experienceScore;
    private String feedback;
    private String filename;

    public CompleteResumeStageRequest() {}

    public CompleteResumeStageRequest(Double score, Double skillsMatchScore, Double experienceScore, String feedback, String filename) {
        this.score = score;
        this.skillsMatchScore = skillsMatchScore;
        this.experienceScore = experienceScore;
        this.feedback = feedback;
        this.filename = filename;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getSkillsMatchScore() {
        return skillsMatchScore;
    }

    public void setSkillsMatchScore(Double skillsMatchScore) {
        this.skillsMatchScore = skillsMatchScore;
    }

    public Double getExperienceScore() {
        return experienceScore;
    }

    public void setExperienceScore(Double experienceScore) {
        this.experienceScore = experienceScore;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }
}
