package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "answers")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_question_id", nullable = false, unique = true)
    private InterviewQuestion interviewQuestion;

    @Column(name = "answer_text", columnDefinition = "MEDIUMTEXT")
    private String answerText;

    @Column(name = "selected_option", length = 10)
    private String selectedOption; // A, B, C, D

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "answer_status", nullable = false, length = 50)
    private String answerStatus = "SUBMITTED";

    @OneToOne(mappedBy = "answer", cascade = CascadeType.ALL, orphanRemoval = true)
    private Evaluation evaluation;

    public Answer() {}

    public Answer(InterviewQuestion interviewQuestion, String answerText) {
        this.interviewQuestion = interviewQuestion;
        this.answerText = answerText;
        this.submittedAt = LocalDateTime.now();
        this.answerStatus = "SUBMITTED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public InterviewQuestion getInterviewQuestion() { return interviewQuestion; }
    public void setInterviewQuestion(InterviewQuestion interviewQuestion) { this.interviewQuestion = interviewQuestion; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public String getSelectedOption() { return selectedOption; }
    public void setSelectedOption(String selectedOption) { this.selectedOption = selectedOption; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public String getAnswerStatus() { return answerStatus; }
    public void setAnswerStatus(String answerStatus) { this.answerStatus = answerStatus; }

    public Evaluation getEvaluation() { return evaluation; }
    public void setEvaluation(Evaluation evaluation) { this.evaluation = evaluation; }
}
