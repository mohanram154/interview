package com.interview.platform.dto.interview;

public class EvaluationResponse {
    private Long id;
    private double technicalAccuracyScore;
    private double relevanceScore;
    private double completenessScore;
    private double clarityScore;
    private double overallScore;
    private String sentimentLabel;
    private Double sentimentConfidence;
    private String feedback;
    private String strengths;
    private String improvements;
    private String evaluationStatus;

    public EvaluationResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }

    public String getImprovements() { return improvements; }
    public void setImprovements(String improvements) { this.improvements = improvements; }

    public String getEvaluationStatus() { return evaluationStatus; }
    public void setEvaluationStatus(String evaluationStatus) { this.evaluationStatus = evaluationStatus; }
}
