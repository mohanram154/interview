package com.interview.platform.dto.assessment;

import jakarta.validation.constraints.NotNull;

public class CreateAssessmentSessionRequest {

    @NotNull(message = "Job role ID is required")
    private Long jobRoleId;

    private String difficulty = "INTERMEDIATE";

    public CreateAssessmentSessionRequest() {}

    public CreateAssessmentSessionRequest(Long jobRoleId, String difficulty) {
        this.jobRoleId = jobRoleId;
        this.difficulty = difficulty;
    }

    public Long getJobRoleId() { return jobRoleId; }
    public void setJobRoleId(Long jobRoleId) { this.jobRoleId = jobRoleId; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}

