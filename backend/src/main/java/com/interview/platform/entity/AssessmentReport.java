package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_reports")
public class AssessmentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_session_id", nullable = false, unique = true)
    private AssessmentSession assessmentSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "job_role_name", nullable = false, length = 100)
    private String jobRoleName;

    @Column(nullable = false, length = 50)
    private String difficulty;

    @Column(nullable = false, length = 50)
    private String status = "COMPLETED"; // COMPLETED, INCOMPLETE

    @Column(name = "resume_weight", nullable = false)
    private Double resumeWeight = 0.30;

    @Column(name = "mcq_weight", nullable = false)
    private Double mcqWeight = 0.30;

    @Column(name = "video_weight", nullable = false)
    private Double videoWeight = 0.40;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "resume_score")
    private Double resumeScore;

    @Column(name = "mcq_score")
    private Double mcqScore;

    @Column(name = "video_score")
    private Double videoScore;

    @Lob
    @Column(name = "resume_card_json", columnDefinition = "LONGTEXT")
    private String resumeCardJson;

    @Lob
    @Column(name = "mcq_card_json", columnDefinition = "LONGTEXT")
    private String mcqCardJson;

    @Lob
    @Column(name = "video_card_json", columnDefinition = "LONGTEXT")
    private String videoCardJson;

    @Lob
    @Column(name = "strengths_json", columnDefinition = "LONGTEXT")
    private String strengthsJson;

    @Lob
    @Column(name = "skill_gaps_json", columnDefinition = "LONGTEXT")
    private String skillGapsJson;

    @Lob
    @Column(name = "learning_roadmap_json", columnDefinition = "LONGTEXT")
    private String learningRoadmapJson;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String disclaimer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public AssessmentReport() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AssessmentSession getAssessmentSession() { return assessmentSession; }
    public void setAssessmentSession(AssessmentSession assessmentSession) { this.assessmentSession = assessmentSession; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getJobRoleName() { return jobRoleName; }
    public void setJobRoleName(String jobRoleName) { this.jobRoleName = jobRoleName; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getResumeWeight() { return resumeWeight; }
    public void setResumeWeight(Double resumeWeight) { this.resumeWeight = resumeWeight; }

    public Double getMcqWeight() { return mcqWeight; }
    public void setMcqWeight(Double mcqWeight) { this.mcqWeight = mcqWeight; }

    public Double getVideoWeight() { return videoWeight; }
    public void setVideoWeight(Double videoWeight) { this.videoWeight = videoWeight; }

    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }

    public Double getResumeScore() { return resumeScore; }
    public void setResumeScore(Double resumeScore) { this.resumeScore = resumeScore; }

    public Double getMcqScore() { return mcqScore; }
    public void setMcqScore(Double mcqScore) { this.mcqScore = mcqScore; }

    public Double getVideoScore() { return videoScore; }
    public void setVideoScore(Double videoScore) { this.videoScore = videoScore; }

    public String getResumeCardJson() { return resumeCardJson; }
    public void setResumeCardJson(String resumeCardJson) { this.resumeCardJson = resumeCardJson; }

    public String getMcqCardJson() { return mcqCardJson; }
    public void setMcqCardJson(String mcqCardJson) { this.mcqCardJson = mcqCardJson; }

    public String getVideoCardJson() { return videoCardJson; }
    public void setVideoCardJson(String videoCardJson) { this.videoCardJson = videoCardJson; }

    public String getStrengthsJson() { return strengthsJson; }
    public void setStrengthsJson(String strengthsJson) { this.strengthsJson = strengthsJson; }

    public String getSkillGapsJson() { return skillGapsJson; }
    public void setSkillGapsJson(String skillGapsJson) { this.skillGapsJson = skillGapsJson; }

    public String getLearningRoadmapJson() { return learningRoadmapJson; }
    public void setLearningRoadmapJson(String learningRoadmapJson) { this.learningRoadmapJson = learningRoadmapJson; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

