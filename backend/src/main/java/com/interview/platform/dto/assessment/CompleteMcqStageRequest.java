package com.interview.platform.dto.assessment;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public class CompleteMcqStageRequest {

    private Long mcqInterviewId;

    @DecimalMin(value = "0.0", message = "Score must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Score cannot exceed 100.0")
    private Double score;

    public CompleteMcqStageRequest() {}

    public CompleteMcqStageRequest(Long mcqInterviewId, Double score) {
        this.mcqInterviewId = mcqInterviewId;
        this.score = score;
    }

    public Long getMcqInterviewId() {
        return mcqInterviewId;
    }

    public void setMcqInterviewId(Long mcqInterviewId) {
        this.mcqInterviewId = mcqInterviewId;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }
}

