package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resume_evaluations")
public class ResumeEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_session_id", nullable = false, unique = true)
    private AssessmentSession assessmentSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "target_role", nullable = false, length = 100)
    private String targetRole;

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "is_custom_job_description", nullable = false)
    private boolean customJobDescription;

    @Column(name = "resume_filename", nullable = false)
    private String resumeFilename;

    @Column(name = "resume_file_size", nullable = false)
    private Long resumeFileSize;

    @Column(name = "resume_file_type", nullable = false, length = 50)
    private String resumeFileType;

    @Lob
    @Column(name = "extracted_data", columnDefinition = "LONGTEXT")
    private String extractedData;

    @Lob
    @Column(name = "corrected_data", columnDefinition = "LONGTEXT")
    private String correctedData;

    @Column(name = "overall_match_score", nullable = false)
    private Double overallMatchScore = 0.0;

    @Column(name = "technical_skill_score", nullable = false)
    private Double technicalSkillScore = 0.0;

    @Column(name = "project_experience_score", nullable = false)
    private Double projectExperienceScore = 0.0;

    @Column(name = "internship_work_score", nullable = false)
    private Double internshipWorkScore = 0.0;

    @Column(name = "education_cert_score", nullable = false)
    private Double educationCertScore = 0.0;

    @Column(name = "practical_evidence_score", nullable = false)
    private Double practicalEvidenceScore = 0.0;

    @Column(name = "role_alignment_score", nullable = false)
    private Double roleAlignmentScore = 0.0;

    @Lob
    @Column(name = "matched_skills", columnDefinition = "LONGTEXT")
    private String matchedSkills;

    @Lob
    @Column(name = "missing_skills", columnDefinition = "LONGTEXT")
    private String missingSkills;

    @Lob
    @Column(name = "relevant_projects", columnDefinition = "LONGTEXT")
    private String relevantProjects;

    @Lob
    @Column(name = "strengths", columnDefinition = "LONGTEXT")
    private String strengths;

    @Lob
    @Column(name = "requirements_not_evidenced", columnDefinition = "LONGTEXT")
    private String requirementsNotEvidenced;

    @Lob
    @Column(name = "improvement_suggestions", columnDefinition = "LONGTEXT")
    private String improvementSuggestions;

    @Lob
    @Column(name = "score_explanations", columnDefinition = "LONGTEXT")
    private String scoreExplanations;

    @Column(name = "evaluation_benchmark", nullable = false)
    private String evaluationBenchmark;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ResumeEvaluation() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AssessmentSession getAssessmentSession() { return assessmentSession; }
    public void setAssessmentSession(AssessmentSession assessmentSession) { this.assessmentSession = assessmentSession; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public boolean isCustomJobDescription() { return customJobDescription; }
    public void setCustomJobDescription(boolean customJobDescription) { this.customJobDescription = customJobDescription; }

    public String getResumeFilename() { return resumeFilename; }
    public void setResumeFilename(String resumeFilename) { this.resumeFilename = resumeFilename; }

    public Long getResumeFileSize() { return resumeFileSize; }
    public void setResumeFileSize(Long resumeFileSize) { this.resumeFileSize = resumeFileSize; }

    public String getResumeFileType() { return resumeFileType; }
    public void setResumeFileType(String resumeFileType) { this.resumeFileType = resumeFileType; }

    public String getExtractedData() { return extractedData; }
    public void setExtractedData(String extractedData) { this.extractedData = extractedData; }

    public String getCorrectedData() { return correctedData; }
    public void setCorrectedData(String correctedData) { this.correctedData = correctedData; }

    public Double getOverallMatchScore() { return overallMatchScore; }
    public void setOverallMatchScore(Double overallMatchScore) { this.overallMatchScore = overallMatchScore; }

    public Double getTechnicalSkillScore() { return technicalSkillScore; }
    public void setTechnicalSkillScore(Double technicalSkillScore) { this.technicalSkillScore = technicalSkillScore; }

    public Double getProjectExperienceScore() { return projectExperienceScore; }
    public void setProjectExperienceScore(Double projectExperienceScore) { this.projectExperienceScore = projectExperienceScore; }

    public Double getInternshipWorkScore() { return internshipWorkScore; }
    public void setInternshipWorkScore(Double internshipWorkScore) { this.internshipWorkScore = internshipWorkScore; }

    public Double getEducationCertScore() { return educationCertScore; }
    public void setEducationCertScore(Double educationCertScore) { this.educationCertScore = educationCertScore; }

    public Double getPracticalEvidenceScore() { return practicalEvidenceScore; }
    public void setPracticalEvidenceScore(Double practicalEvidenceScore) { this.practicalEvidenceScore = practicalEvidenceScore; }

    public Double getRoleAlignmentScore() { return roleAlignmentScore; }
    public void setRoleAlignmentScore(Double roleAlignmentScore) { this.roleAlignmentScore = roleAlignmentScore; }

    public String getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(String matchedSkills) { this.matchedSkills = matchedSkills; }

    public String getMissingSkills() { return missingSkills; }
    public void setMissingSkills(String missingSkills) { this.missingSkills = missingSkills; }

    public String getRelevantProjects() { return relevantProjects; }
    public void setRelevantProjects(String relevantProjects) { this.relevantProjects = relevantProjects; }

    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }

    public String getRequirementsNotEvidenced() { return requirementsNotEvidenced; }
    public void setRequirementsNotEvidenced(String requirementsNotEvidenced) { this.requirementsNotEvidenced = requirementsNotEvidenced; }

    public String getImprovementSuggestions() { return improvementSuggestions; }
    public void setImprovementSuggestions(String improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }

    public String getScoreExplanations() { return scoreExplanations; }
    public void setScoreExplanations(String scoreExplanations) { this.scoreExplanations = scoreExplanations; }

    public String getEvaluationBenchmark() { return evaluationBenchmark; }
    public void setEvaluationBenchmark(String evaluationBenchmark) { this.evaluationBenchmark = evaluationBenchmark; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
