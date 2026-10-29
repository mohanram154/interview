package com.interview.platform.dto.assessment;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class CompleteVideoStageRequest {

    @NotNull(message = "Video score is required")
    @DecimalMin(value = "0.0", message = "Score must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Score cannot exceed 100.0")
    private Double score;

    private Double technicalScore;
    private Double communicationScore;
    private String sentimentLabel;
    private String feedback;

    public CompleteVideoStageRequest() {}

    public CompleteVideoStageRequest(Double score, Double technicalScore, Double communicationScore, String sentimentLabel, String feedback) {
        this.score = score;
        this.technicalScore = technicalScore;
        this.communicationScore = communicationScore;
        this.sentimentLabel = sentimentLabel;
        this.feedback = feedback;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getTechnicalScore() {
        return technicalScore;
    }

    public void setTechnicalScore(Double technicalScore) {
        this.technicalScore = technicalScore;
    }

    public Double getCommunicationScore() {
        return communicationScore;
    }

    public void setCommunicationScore(Double communicationScore) {
        this.communicationScore = communicationScore;
    }

    public String getSentimentLabel() {
        return sentimentLabel;
    }

    public void setSentimentLabel(String sentimentLabel) {
        this.sentimentLabel = sentimentLabel;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}

