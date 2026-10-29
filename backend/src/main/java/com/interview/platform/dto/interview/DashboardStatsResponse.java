package com.interview.platform.dto.interview;

import java.util.List;

public class DashboardStatsResponse {
    private long totalInterviews;
    private long completedInterviews;
    private double averageScore;
    private List<InterviewResponse> recentInterviews;

    public DashboardStatsResponse() {}

    public DashboardStatsResponse(long totalInterviews, long completedInterviews, double averageScore, List<InterviewResponse> recentInterviews) {
        this.totalInterviews = totalInterviews;
        this.completedInterviews = completedInterviews;
        this.averageScore = averageScore;
        this.recentInterviews = recentInterviews;
    }

    public long getTotalInterviews() { return totalInterviews; }
    public void setTotalInterviews(long totalInterviews) { this.totalInterviews = totalInterviews; }

    public long getCompletedInterviews() { return completedInterviews; }
    public void setCompletedInterviews(long completedInterviews) { this.completedInterviews = completedInterviews; }

    public double getAverageScore() { return averageScore; }
    public void setAverageScore(double averageScore) { this.averageScore = averageScore; }

    public List<InterviewResponse> getRecentInterviews() { return recentInterviews; }
    public void setRecentInterviews(List<InterviewResponse> recentInterviews) { this.recentInterviews = recentInterviews; }
}

