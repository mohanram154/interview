package com.interview.platform.dto.interview;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateInterviewRequest {

    @NotNull(message = "Job role ID is required")
    private Long jobRoleId;

    @NotBlank(message = "Difficulty is required")
    private String difficulty = "INTERMEDIATE"; // BEGINNER, INTERMEDIATE, ADVANCED

    @NotBlank(message = "Mode is required")
    private String mode = "MCQ"; // MCQ, TEXT, VOICE

    @Min(value = 1, message = "Minimum 1 question")
    @Max(value = 30, message = "Maximum 30 questions")
    private int questionCount = 20; // Default 20 questions (allows 15 or 20)

    public CreateInterviewRequest() {}

    public Long getJobRoleId() { return jobRoleId; }
    public void setJobRoleId(Long jobRoleId) { this.jobRoleId = jobRoleId; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
}
