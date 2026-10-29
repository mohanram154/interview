package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_sessions")
public class AssessmentSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_role_id", nullable = false)
    private JobRole jobRole;

    @Column(nullable = false, length = 50)
    private String difficulty = "INTERMEDIATE";

    @Column(name = "question_count", nullable = false)
    private Integer questionCount = 20;

    @Column(name = "current_stage", nullable = false, length = 50)
    private String currentStage = "RESUME_EVALUATION";

    @Column(name = "session_status", nullable = false, length = 50)
    private String sessionStatus = "IN_PROGRESS";

    // --- Stage 1: Resume Evaluation ---
    @Column(name = "resume_stage_status", nullable = false, length = 50)
    private String resumeStageStatus = "NOT_STARTED";

    @Column(name = "resume_score")
    private Double resumeScore;

    @Column(name = "resume_filename")
    private String resumeFilename;

    @Column(name = "resume_skills_match_score")
    private Double resumeSkillsMatchScore;

    @Column(name = "resume_experience_score")
    private Double resumeExperienceScore;

    @Column(name = "resume_feedback", columnDefinition = "TEXT")
    private String resumeFeedback;

    @Column(name = "resume_completed_at")
    private LocalDateTime resumeCompletedAt;

    // --- Stage 2: MCQ Round ---
    @Column(name = "mcq_stage_status", nullable = false, length = 50)
    private String mcqStageStatus = "LOCKED";

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mcq_interview_id")
    private Interview mcqInterview;

    @Column(name = "mcq_score")
    private Double mcqScore;

    @Column(name = "mcq_completed_at")
    private LocalDateTime mcqCompletedAt;

    // --- Stage 3: Video Interview ---
    @Column(name = "video_stage_status", nullable = false, length = 50)
    private String videoStageStatus = "LOCKED";

    @Column(name = "video_score")
    private Double videoScore;

    @Column(name = "video_technical_score")
    private Double videoTechnicalScore;

    @Column(name = "video_communication_score")
    private Double videoCommunicationScore;

    @Column(name = "video_sentiment_label", length = 50)
    private String videoSentimentLabel;

    @Column(name = "video_feedback", columnDefinition = "TEXT")
    private String videoFeedback;

    @Column(name = "video_completed_at")
    private LocalDateTime videoCompletedAt;

    // --- Final Combined Outcome ---
    @Column(name = "final_composite_score")
    private Double finalCompositeScore;

    @Column(name = "final_summary", columnDefinition = "TEXT")
    private String finalSummary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public AssessmentSession() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public JobRole getJobRole() { return jobRole; }
    public void setJobRole(JobRole jobRole) { this.jobRole = jobRole; }

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

    public String getMcqStageStatus() { return mcqStageStatus; }
    public void setMcqStageStatus(String mcqStageStatus) { this.mcqStageStatus = mcqStageStatus; }

    public Interview getMcqInterview() { return mcqInterview; }
    public void setMcqInterview(Interview mcqInterview) { this.mcqInterview = mcqInterview; }

    public Double getMcqScore() { return mcqScore; }
    public void setMcqScore(Double mcqScore) { this.mcqScore = mcqScore; }

    public LocalDateTime getMcqCompletedAt() { return mcqCompletedAt; }
    public void setMcqCompletedAt(LocalDateTime mcqCompletedAt) { this.mcqCompletedAt = mcqCompletedAt; }

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

    public Double getFinalCompositeScore() { return finalCompositeScore; }
    public void setFinalCompositeScore(Double finalCompositeScore) { this.finalCompositeScore = finalCompositeScore; }

    public String getFinalSummary() { return finalSummary; }
    public void setFinalSummary(String finalSummary) { this.finalSummary = finalSummary; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getQuestionCount() { return questionCount != null ? questionCount : 20; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}

