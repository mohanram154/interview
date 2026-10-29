package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations")
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false, unique = true)
    private Answer answer;

    @Column(name = "technical_accuracy_score", nullable = false)
    private double technicalAccuracyScore;

    @Column(name = "relevance_score", nullable = false)
    private double relevanceScore;

    @Column(name = "completeness_score", nullable = false)
    private double completenessScore;

    @Column(name = "clarity_score", nullable = false)
    private double clarityScore;

    @Column(name = "overall_score", nullable = false)
    private double overallScore;

    @Column(name = "sentiment_label", length = 50)
    private String sentimentLabel;

    @Column(name = "sentiment_confidence")
    private Double sentimentConfidence;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedback;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String strengths;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String improvements;

    @Column(name = "evaluation_status", nullable = false, length = 50)
    private String evaluationStatus = "COMPLETED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Evaluation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Answer getAnswer() { return answer; }
    public void setAnswer(Answer answer) { this.answer = answer; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
