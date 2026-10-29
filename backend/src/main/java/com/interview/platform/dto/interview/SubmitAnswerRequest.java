package com.interview.platform.dto.interview;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SubmitAnswerRequest {

    @NotNull(message = "Interview question ID is required")
    private Long interviewQuestionId;

    @NotBlank(message = "Answer text cannot be blank")
    @Size(min = 5, max = 10000, message = "Answer must be between 5 and 10000 characters")
    private String answerText;

    public SubmitAnswerRequest() {}

    public SubmitAnswerRequest(Long interviewQuestionId, String answerText) {
        this.interviewQuestionId = interviewQuestionId;
        this.answerText = answerText;
    }

    public Long getInterviewQuestionId() { return interviewQuestionId; }
    public void setInterviewQuestionId(Long interviewQuestionId) { this.interviewQuestionId = interviewQuestionId; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
}
