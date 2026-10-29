package com.interview.platform.dto.ai;

import java.util.List;

public class AiEvaluationResponse {
    private double technicalAccuracyScore;
    private double relevanceScore;
    private double completenessScore;
    private double clarityScore;
    private double overallScore;
    private String sentimentLabel;
    private Double sentimentConfidence;
    private String feedback;
    private List<String> strengths;
    private List<String> improvements;
    private String evaluationMethod;
    private String evaluationStatus;

    public AiEvaluationResponse() {}

    public double getTechnicalAccuracyScore() { return technicalAccuracyScore; }
    public void setTechnicalAccuracyScore(double technicalAccuracyScore) { this.technicalAccuracyScore = technicalAccuracyScore; }

    public double getRelevanceScore() { return relevanceScore; }
    public void setRelevanceScore(double relevanceScore) { this.relevanceScore = relevanceScore; }

    public double getCompletenessScore() { return completenessScore; }
    public void setCompletenessScore(double completenessScore) { this.completenessScore = completenessScore; }

    public double getClarityScore() { return clarityScore; }
    public void setClarityScore(double clarityScore) { this.clarityScore = clarityScore; }

    public double getOverallScore() { return overallScore; }
    public void setOverallScore(double overallScore) { this.overallScore = overallScore; }

    public String getSentimentLabel() { return sentimentLabel; }
    public void setSentimentLabel(String sentimentLabel) { this.sentimentLabel = sentimentLabel; }

    public Double getSentimentConfidence() { return sentimentConfidence; }
    public void setSentimentConfidence(Double sentimentConfidence) { this.sentimentConfidence = sentimentConfidence; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }

    public List<String> getImprovements() { return improvements; }
    public void setImprovements(List<String> improvements) { this.improvements = improvements; }

    public String getEvaluationMethod() { return evaluationMethod; }
    public void setEvaluationMethod(String evaluationMethod) { this.evaluationMethod = evaluationMethod; }

    public String getEvaluationStatus() { return evaluationStatus; }
    public void setEvaluationStatus(String evaluationStatus) { this.evaluationStatus = evaluationStatus; }
}
