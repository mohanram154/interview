package com.interview.platform.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class SubmitResumeEvaluationRequest {

    @NotBlank(message = "Target role is required")
    private String targetRole;

    private String companyName;

    private String jobDescription;

    @NotNull(message = "Corrected resume data is required")
    private Map<String, Object> correctedData;

    private Map<String, Double> customWeights;

    public SubmitResumeEvaluationRequest() {}

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public Map<String, Object> getCorrectedData() { return correctedData; }
    public void setCorrectedData(Map<String, Object> correctedData) { this.correctedData = correctedData; }

    public Map<String, Double> getCustomWeights() { return customWeights; }
    public void setCustomWeights(Map<String, Double> customWeights) { this.customWeights = customWeights; }
}

