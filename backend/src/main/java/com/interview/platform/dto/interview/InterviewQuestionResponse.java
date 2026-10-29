package com.interview.platform.dto.interview;

public class InterviewQuestionResponse {
    private Long id;
    private int sequenceNumber;
    private String questionText;
    private String category;
    private String difficulty;
    private boolean answered;
    private AnswerResponse answer;

    public InterviewQuestionResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(int sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public boolean isAnswered() { return answered; }
    public void setAnswered(boolean answered) { this.answered = answered; }

    public AnswerResponse getAnswer() { return answer; }
    public void setAnswer(AnswerResponse answer) { this.answer = answer; }
}
