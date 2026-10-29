package com.interview.platform.dto.ai;

public class AiEvaluationRequest {
    private String questionText;
    private String answerText;
    private String jobRole;
    private String difficulty;
    private String category;
    private String expectedTopics;

    public AiEvaluationRequest() {}

    public AiEvaluationRequest(String questionText, String answerText, String jobRole, String difficulty, String category, String expectedTopics) {
        this.questionText = questionText;
        this.answerText = answerText;
        this.jobRole = jobRole;
        this.difficulty = difficulty;
        this.category = category;
        this.expectedTopics = expectedTopics;
    }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public String getJobRole() { return jobRole; }
    public void setJobRole(String jobRole) { this.jobRole = jobRole; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getExpectedTopics() { return expectedTopics; }
    public void setExpectedTopics(String expectedTopics) { this.expectedTopics = expectedTopics; }
}

