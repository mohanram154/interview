package com.interview.platform.dto.interview;

import java.time.LocalDateTime;
import java.util.List;

public class InterviewResponse {
    private Long id;
    private Long userId;
    private Long jobRoleId;
    private String jobRoleName;
    private String difficulty;
    private String mode;
    private String status;
    private int totalQuestions;
    private int answeredQuestionsCount;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<InterviewQuestionResponse> questions;

    public InterviewResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getJobRoleId() { return jobRoleId; }
    public void setJobRoleId(Long jobRoleId) { this.jobRoleId = jobRoleId; }

    public String getJobRoleName() { return jobRoleName; }
    public void setJobRoleName(String jobRoleName) { this.jobRoleName = jobRoleName; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getAnsweredQuestionsCount() { return answeredQuestionsCount; }
    public void setAnsweredQuestionsCount(int answeredQuestionsCount) { this.answeredQuestionsCount = answeredQuestionsCount; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public List<InterviewQuestionResponse> getQuestions() { return questions; }
    public void setQuestions(List<InterviewQuestionResponse> questions) { this.questions = questions; }
}

