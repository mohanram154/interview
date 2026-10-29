package com.interview.platform.service;

import com.interview.platform.dto.interview.ReportResponse;
import com.interview.platform.entity.*;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.InterviewReportRepository;
import com.interview.platform.repository.InterviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final InterviewRepository interviewRepository;
    private final InterviewReportRepository reportRepository;
    private final InterviewService interviewService;

    public ReportService(
            InterviewRepository interviewRepository,
            InterviewReportRepository reportRepository,
            InterviewService interviewService
    ) {
        this.interviewRepository = interviewRepository;
        this.reportRepository = reportRepository;
        this.interviewService = interviewService;
    }

    @Transactional
    public ReportResponse completeInterview(Long interviewId, Long userId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to complete this interview.");
        }

        // If report already generated, return existing report
        Optional<InterviewReport> existingReport = reportRepository.findByInterviewId(interviewId);
        if (existingReport.isPresent()) {
            return mapToReportResponse(existingReport.get(), interview);
        }

        List<InterviewQuestion> questions = interview.getQuestions();
        if (questions == null || questions.isEmpty()) {
            throw new BadRequestException("Interview has no questions.");
        }

        List<Evaluation> evaluations = questions.stream()
                .map(InterviewQuestion::getAnswer)
                .filter(Objects::nonNull)
                .map(Answer::getEvaluation)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (evaluations.isEmpty()) {
            throw new BadRequestException("Cannot complete an interview without any answered and evaluated questions.");
        }

        double totalTechnical = 0.0;
        double totalRelevance = 0.0;
        double totalCompleteness = 0.0;
        double totalClarity = 0.0;
        double totalOverall = 0.0;

        Set<String> strengthsSet = new LinkedHashSet<>();
        Set<String> improvementsSet = new LinkedHashSet<>();

        for (Evaluation eval : evaluations) {
            totalTechnical += eval.getTechnicalAccuracyScore();
            totalRelevance += eval.getRelevanceScore();
            totalCompleteness += eval.getCompletenessScore();
            totalClarity += eval.getClarityScore();
            totalOverall += eval.getOverallScore();

            if (eval.getStrengths() != null) {
                for (String s : eval.getStrengths().split(";;")) {
                    if (!s.isBlank()) strengthsSet.add(s.trim());
                }
            }
            if (eval.getImprovements() != null) {
                for (String imp : eval.getImprovements().split(";;")) {
                    if (!imp.isBlank()) improvementsSet.add(imp.trim());
                }
            }
        }

        int count = evaluations.size();
        double avgTechnical = Math.round((totalTechnical / count) * 10.0) / 10.0;
        double avgClarity = Math.round((totalClarity / count) * 10.0) / 10.0;
        double avgOverall = Math.round((totalOverall / count) * 10.0) / 10.0;

        // Structured performance summary
        String summary = String.format(
                "Completed %s mock interview for role '%s' at %s difficulty level. Answered %d of %d questions with an overall competency score of %.1f/100 (Technical Accuracy: %.1f/100, Communication Clarity: %.1f/100).",
                interview.getMode(),
                interview.getJobRole().getName(),
                interview.getDifficulty(),
                count,
                interview.getTotalQuestions(),
                avgOverall,
                avgTechnical,
                avgClarity
        );

        List<String> recommendations = new ArrayList<>();
        if (avgTechnical < 60.0) {
            recommendations.add("Deepen technical conceptual understanding in " + interview.getJobRole().getName() + " core principles.");
        } else if (avgTechnical < 80.0) {
            recommendations.add("Strengthen system internals and edge case handling during technical explanations.");
        } else {
            recommendations.add("Outstanding technical depth demonstrated. Continue challenging yourself with advanced architectural questions.");
        }

        if (avgClarity < 70.0) {
            recommendations.add("Structure answers using the STAR technique (Situation, Task, Action, Result) for improved clarity.");
        } else {
            recommendations.add("Effective and structured technical communication style.");
        }
        recommendations.add("Practice more questions under real-time conditions to maintain confidence.");

        InterviewReport report = new InterviewReport();
        report.setInterview(interview);
        report.setOverallScore(avgOverall);
        report.setTechnicalScore(avgTechnical);
        report.setCommunicationScore(avgClarity);
        report.setSummary(summary);
        report.setStrengths(String.join(";;", strengthsSet));
        report.setImprovementAreas(String.join(";;", improvementsSet));
        report.setRecommendations(String.join(";;", recommendations));
        report.setReportStatus("COMPLETED");

        InterviewReport savedReport = reportRepository.save(report);

        // Update interview status
        interview.setStatus("COMPLETED");
        interview.setCompletedAt(LocalDateTime.now());
        interviewRepository.save(interview);

        return mapToReportResponse(savedReport, interview);
    }

    @Transactional(readOnly = true)
    public ReportResponse getInterviewReport(Long interviewId, Long userId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to view this interview report.");
        }

        InterviewReport report = reportRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found for interview ID: " + interviewId + ". The interview may still be in progress."));

        return mapToReportResponse(report, interview);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getUserReportHistory(Long userId) {
        List<InterviewReport> reports = reportRepository.findByUserId(userId);
        return reports.stream()
                .map(r -> mapToReportResponse(r, r.getInterview()))
                .collect(Collectors.toList());
    }

    private ReportResponse mapToReportResponse(InterviewReport report, Interview interview) {
        ReportResponse resp = new ReportResponse();
        resp.setId(report.getId());
        resp.setInterviewId(interview.getId());
        resp.setJobRoleName(interview.getJobRole().getName());
        resp.setDifficulty(interview.getDifficulty());
        resp.setMode(interview.getMode());
        resp.setOverallScore(report.getOverallScore());
        resp.setTechnicalScore(report.getTechnicalScore());
        resp.setCommunicationScore(report.getCommunicationScore());
        resp.setSummary(report.getSummary());

        resp.setStrengths(report.getStrengths() != null ? Arrays.asList(report.getStrengths().split(";;")) : Collections.emptyList());
        resp.setImprovementAreas(report.getImprovementAreas() != null ? Arrays.asList(report.getImprovementAreas().split(";;")) : Collections.emptyList());
        resp.setRecommendations(report.getRecommendations() != null ? Arrays.asList(report.getRecommendations().split(";;")) : Collections.emptyList());

        resp.setReportStatus(report.getReportStatus());
        resp.setCreatedAt(report.getCreatedAt());

        if (interview.getQuestions() != null) {
            resp.setQuestions(interview.getQuestions().stream()
                    .map(interviewService::mapToInterviewQuestionResponse)
                    .collect(Collectors.toList()));
        }

        return resp;
    }
}
