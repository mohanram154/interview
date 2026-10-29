package com.interview.platform.dto.resume;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ResumeEvaluationResponse {

    private Long id;
    private Long assessmentSessionId;
    private String targetRole;
    private String companyName;
    private boolean customJobDescription;
    private String resumeFilename;
    private String resumeFileType;
    private Long resumeFileSize;

    // Scores
    private Double overallMatchScore;
    private Double technicalSkillScore;
    private Double projectExperienceScore;
    private Double internshipWorkScore;
    private Double educationCertScore;
    private Double practicalEvidenceScore;
    private Double roleAlignmentScore;

    // Rich analysis objects
    private List<Map<String, Object>> matchedSkills;
    private List<Map<String, Object>> missingSkills;
    private List<Map<String, Object>> relevantProjects;
    private List<String> strengths;
    private List<String> requirementsNotEvidenced;
    private List<String> improvementSuggestions;
    private Map<String, Object> scoreExplanations;

    // Review and Extracted Data
    private Map<String, Object> extractedData;
    private Map<String, Object> correctedData;

    private String evaluationBenchmark;
    private String benchmarkNote;
    private LocalDateTime completedAt;

    public ResumeEvaluationResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAssessmentSessionId() { return assessmentSessionId; }
    public void setAssessmentSessionId(Long assessmentSessionId) { this.assessmentSessionId = assessmentSessionId; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public boolean isCustomJobDescription() { return customJobDescription; }
    public void setCustomJobDescription(boolean customJobDescription) { this.customJobDescription = customJobDescription; }

    public String getResumeFilename() { return resumeFilename; }
    public void setResumeFilename(String resumeFilename) { this.resumeFilename = resumeFilename; }

    public String getResumeFileType() { return resumeFileType; }
    public void setResumeFileType(String resumeFileType) { this.resumeFileType = resumeFileType; }

    public Long getResumeFileSize() { return resumeFileSize; }
    public void setResumeFileSize(Long resumeFileSize) { this.resumeFileSize = resumeFileSize; }

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

    public List<Map<String, Object>> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<Map<String, Object>> matchedSkills) { this.matchedSkills = matchedSkills; }

    public List<Map<String, Object>> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<Map<String, Object>> missingSkills) { this.missingSkills = missingSkills; }

    public List<Map<String, Object>> getRelevantProjects() { return relevantProjects; }
    public void setRelevantProjects(List<Map<String, Object>> relevantProjects) { this.relevantProjects = relevantProjects; }

    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }

    public List<String> getRequirementsNotEvidenced() { return requirementsNotEvidenced; }
    public void setRequirementsNotEvidenced(List<String> requirementsNotEvidenced) { this.requirementsNotEvidenced = requirementsNotEvidenced; }

    public List<String> getImprovementSuggestions() { return improvementSuggestions; }
    public void setImprovementSuggestions(List<String> improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }

    public Map<String, Object> getScoreExplanations() { return scoreExplanations; }
    public void setScoreExplanations(Map<String, Object> scoreExplanations) { this.scoreExplanations = scoreExplanations; }

    public Map<String, Object> getExtractedData() { return extractedData; }
    public void setExtractedData(Map<String, Object> extractedData) { this.extractedData = extractedData; }

    public Map<String, Object> getCorrectedData() { return correctedData; }
    public void setCorrectedData(Map<String, Object> correctedData) { this.correctedData = correctedData; }

    public String getEvaluationBenchmark() { return evaluationBenchmark; }
    public void setEvaluationBenchmark(String evaluationBenchmark) { this.evaluationBenchmark = evaluationBenchmark; }

    public String getBenchmarkNote() { return benchmarkNote; }
    public void setBenchmarkNote(String benchmarkNote) { this.benchmarkNote = benchmarkNote; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
