package com.interview.platform.controller;

import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.dto.interview.*;
import com.interview.platform.security.UserPrincipal;
import com.interview.platform.service.InterviewService;
import com.interview.platform.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interviews")
public class InterviewController {

    private final InterviewService interviewService;
    private final ReportService reportService;

    public InterviewController(InterviewService interviewService, ReportService reportService) {
        this.interviewService = interviewService;
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InterviewResponse>> createInterview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateInterviewRequest request
    ) {
        InterviewResponse response = interviewService.createInterview(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interview session created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InterviewResponse>>> getUserInterviews(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<InterviewResponse> responses = interviewService.getUserInterviews(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("User interviews retrieved", responses));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DashboardStatsResponse stats = interviewService.getDashboardStats(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved", stats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InterviewResponse>> getInterviewById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        InterviewResponse response = interviewService.getInterviewById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Interview retrieved", response));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<List<InterviewQuestionResponse>>> getInterviewQuestions(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<InterviewQuestionResponse> questions = interviewService.getInterviewQuestions(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Interview questions retrieved", questions));
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<ApiResponse<AnswerResponse>> submitAnswer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitAnswerRequest request
    ) {
        AnswerResponse response = interviewService.submitAnswer(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Answer evaluated and saved successfully", response));
    }

    @PutMapping("/{id}/questions/{questionId}/review")
    public ResponseEntity<ApiResponse<Boolean>> toggleMarkForReview(
            @PathVariable Long id,
            @PathVariable Long questionId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Boolean marked
    ) {
        boolean result = interviewService.toggleMarkForReview(id, questionId, principal.getId(), marked);
        return ResponseEntity.ok(ApiResponse.success("Question review status updated", result));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ReportResponse>> completeInterview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ReportResponse response = reportService.completeInterview(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Interview completed and report generated", response));
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<ApiResponse<ReportResponse>> getInterviewReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ReportResponse response = reportService.getInterviewReport(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Interview report retrieved", response));
    }
}
