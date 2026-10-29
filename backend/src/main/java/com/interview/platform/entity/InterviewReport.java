package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_reports")
public class InterviewReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false, unique = true)
    private Interview interview;

    @Column(name = "overall_score", nullable = false)
    private double overallScore;

    @Column(name = "technical_score", nullable = false)
    private double technicalScore;

    @Column(name = "communication_score", nullable = false)
    private double communicationScore;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "improvement_areas", nullable = false, columnDefinition = "TEXT")
    private String improvementAreas;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "report_status", nullable = false, length = 50)
    private String reportStatus = "COMPLETED";

    @Column(name = "total_questions_count")
    private Integer totalQuestionsCount;

    @Column(name = "correct_answers_count")
    private Integer correctAnswersCount;

    @Column(name = "incorrect_answers_count")
    private Integer incorrectAnswersCount;

    @Column(name = "unanswered_count")
    private Integer unansweredCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public InterviewReport() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Interview getInterview() { return interview; }
    public void setInterview(Interview interview) { this.interview = interview; }

    public double getOverallScore() { return overallScore; }
    public void setOverallScore(double overallScore) { this.overallScore = overallScore; }

    public double getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(double technicalScore) { this.technicalScore = technicalScore; }

    public double getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(double communicationScore) { this.communicationScore = communicationScore; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }

    public String getImprovementAreas() { return improvementAreas; }
    public void setImprovementAreas(String improvementAreas) { this.improvementAreas = improvementAreas; }

    public String getRecommendations() { return recommendations; }
    public void setRecommendations(String recommendations) { this.recommendations = recommendations; }

    public String getReportStatus() { return reportStatus; }
    public void setReportStatus(String reportStatus) { this.reportStatus = reportStatus; }

    public Integer getTotalQuestionsCount() { return totalQuestionsCount; }
    public void setTotalQuestionsCount(Integer totalQuestionsCount) { this.totalQuestionsCount = totalQuestionsCount; }

    public Integer getCorrectAnswersCount() { return correctAnswersCount; }
    public void setCorrectAnswersCount(Integer correctAnswersCount) { this.correctAnswersCount = correctAnswersCount; }

    public Integer getIncorrectAnswersCount() { return incorrectAnswersCount; }
    public void setIncorrectAnswersCount(Integer incorrectAnswersCount) { this.incorrectAnswersCount = incorrectAnswersCount; }

    public Integer getUnansweredCount() { return unansweredCount; }
    public void setUnansweredCount(Integer unansweredCount) { this.unansweredCount = unansweredCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
