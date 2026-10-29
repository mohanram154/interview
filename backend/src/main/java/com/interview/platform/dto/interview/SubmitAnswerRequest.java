package com.interview.platform.dto.interview;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SubmitAnswerRequest {

    @NotNull(message = "Interview question ID is required")
    private Long interviewQuestionId;

    @Size(max = 10000, message = "Answer must be under 10000 characters")
    private String answerText;

    private String selectedOption; // A, B, C, D

    private Boolean markedForReview;

    public SubmitAnswerRequest() {}

    public SubmitAnswerRequest(Long interviewQuestionId, String answerText) {
        this.interviewQuestionId = interviewQuestionId;
        this.answerText = answerText;
    }

    public SubmitAnswerRequest(Long interviewQuestionId, String answerText, String selectedOption) {
        this.interviewQuestionId = interviewQuestionId;
        this.answerText = answerText;
        this.selectedOption = selectedOption;
    }

    public Long getInterviewQuestionId() { return interviewQuestionId; }
    public void setInterviewQuestionId(Long interviewQuestionId) { this.interviewQuestionId = interviewQuestionId; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public String getSelectedOption() { return selectedOption; }
    public void setSelectedOption(String selectedOption) { this.selectedOption = selectedOption; }

    public Boolean getMarkedForReview() { return markedForReview; }
    public void setMarkedForReview(Boolean markedForReview) { this.markedForReview = markedForReview; }
}
