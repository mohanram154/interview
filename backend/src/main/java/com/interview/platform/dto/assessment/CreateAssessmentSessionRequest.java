package com.interview.platform.dto.assessment;

import jakarta.validation.constraints.NotNull;

public class CreateAssessmentSessionRequest {

    @NotNull(message = "Job role ID is required")
    private Long jobRoleId;

    private String difficulty = "INTERMEDIATE";

    private Integer questionCount = 20;

    public CreateAssessmentSessionRequest() {}

    public CreateAssessmentSessionRequest(Long jobRoleId, String difficulty) {
        this.jobRoleId = jobRoleId;
        this.difficulty = difficulty;
        this.questionCount = 20;
    }

    public CreateAssessmentSessionRequest(Long jobRoleId, String difficulty, Integer questionCount) {
        this.jobRoleId = jobRoleId;
        this.difficulty = difficulty;
        this.questionCount = questionCount != null ? questionCount : 20;
    }

    public Long getJobRoleId() { return jobRoleId; }
    public void setJobRoleId(Long jobRoleId) { this.jobRoleId = jobRoleId; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public Integer getQuestionCount() { return questionCount != null ? questionCount : 20; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
}

