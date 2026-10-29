package com.interview.platform.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "interview_questions")
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(name = "question_text_snapshot", nullable = false, columnDefinition = "TEXT")
    private String questionTextSnapshot;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 50)
    private String difficulty;

    @Column(name = "expected_topics", columnDefinition = "TEXT")
    private String expectedTopics;

    @OneToOne(mappedBy = "interviewQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private Answer answer;

    public InterviewQuestion() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Interview getInterview() { return interview; }
    public void setInterview(Interview interview) { this.interview = interview; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public String getQuestionTextSnapshot() { return questionTextSnapshot; }
    public void setQuestionTextSnapshot(String questionTextSnapshot) { this.questionTextSnapshot = questionTextSnapshot; }

    public int getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(int sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getExpectedTopics() { return expectedTopics; }
    public void setExpectedTopics(String expectedTopics) { this.expectedTopics = expectedTopics; }

    public Answer getAnswer() { return answer; }
    public void setAnswer(Answer answer) { this.answer = answer; }
}
