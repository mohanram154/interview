package com.interview.platform.dto.interview;

import java.time.LocalDateTime;

public class AnswerResponse {
    private Long id;
    private Long interviewQuestionId;
    private String answerText;
    private String selectedOption;
    private Boolean isCorrect;
    private String answerStatus;
    private LocalDateTime submittedAt;
    private EvaluationResponse evaluation;

    public AnswerResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getInterviewQuestionId() { return interviewQuestionId; }
    public void setInterviewQuestionId(Long interviewQuestionId) { this.interviewQuestionId = interviewQuestionId; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public String getSelectedOption() { return selectedOption; }
    public void setSelectedOption(String selectedOption) { this.selectedOption = selectedOption; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public String getAnswerStatus() { return answerStatus; }
    public void setAnswerStatus(String answerStatus) { this.answerStatus = answerStatus; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public EvaluationResponse getEvaluation() { return evaluation; }
    public void setEvaluation(EvaluationResponse evaluation) { this.evaluation = evaluation; }
}
