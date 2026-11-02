package com.interview.platform.controller;

import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.CompleteMcqStageRequest;
import com.interview.platform.dto.assessment.CompleteResumeStageRequest;
import com.interview.platform.dto.assessment.CompleteVideoStageRequest;
import com.interview.platform.dto.assessment.CreateAssessmentSessionRequest;
import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.dto.interview.InterviewResponse;
import com.interview.platform.dto.report.AssessmentReportResponse;
import com.interview.platform.entity.AssessmentSession;
import com.interview.platform.security.UserPrincipal;
import com.interview.platform.service.AssessmentReportService;
import com.interview.platform.service.AssessmentSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assessment-sessions")
public class AssessmentSessionController {

    private final AssessmentSessionService assessmentSessionService;
    private final AssessmentReportService assessmentReportService;

    public AssessmentSessionController(
            AssessmentSessionService assessmentSessionService,
            AssessmentReportService assessmentReportService
    ) {
        this.assessmentSessionService = assessmentSessionService;
        this.assessmentReportService = assessmentReportService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> createSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateAssessmentSessionRequest request
    ) {
        AssessmentSessionResponse response = assessmentSessionService.createSession(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assessment session initialized at Stage 1 (Resume Evaluation)", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> getSessionById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentSessionResponse response = assessmentSessionService.getSessionById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Assessment session retrieved", response));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> getActiveSession(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentSessionResponse response = assessmentSessionService.getActiveSession(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Active assessment session retrieved", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AssessmentSessionResponse>>> getUserSessions(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<AssessmentSessionResponse> list = assessmentSessionService.getUserSessions(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("User assessment sessions retrieved", list));
    }

    @GetMapping("/{id}/validate-stage")
    public ResponseEntity<ApiResponse<Boolean>> validateStageAccess(
            @PathVariable Long id,
            @RequestParam String stage,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentSessionResponse session = assessmentSessionService.getSessionById(id, principal.getId());
        // Call internal validation
        assessmentSessionService.validateStageAccess(
                toEntitySnapshot(session),
                stage
        );
        return ResponseEntity.ok(ApiResponse.success("Stage access granted", true));
    }

    @PutMapping("/{id}/resume/start")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> startResumeRound(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentSessionResponse response = assessmentSessionService.startResumeRound(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Resume evaluation round started", response));
    }

    @PostMapping("/{id}/resume/complete")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> completeResumeRound(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteResumeStageRequest request
    ) {
        AssessmentSessionResponse response = assessmentSessionService.completeResumeStage(
                id,
                principal.getId(),
                request.getScore(),
                request.getSkillsMatchScore(),
                request.getExperienceScore(),
                request.getFeedback(),
                request.getFilename()
        );
        return ResponseEntity.ok(ApiResponse.success("Resume evaluation completed; MCQ Technical Assessment unlocked!", response));
    }

    @PostMapping("/{id}/mcq/start")
    public ResponseEntity<ApiResponse<InterviewResponse>> startOrResumeMcqRound(
            @PathVariable Long id,
            @RequestParam(required = false) Integer questionCount,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        InterviewResponse response = assessmentSessionService.startOrResumeMcqRound(id, principal.getId(), questionCount);
        return ResponseEntity.ok(ApiResponse.success("MCQ Technical Assessment initialized or resumed", response));
    }

    @PostMapping("/{id}/mcq/complete")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> completeMcqRound(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) CompleteMcqStageRequest request
    ) {
        Long interviewId = request != null ? request.getMcqInterviewId() : null;
        Double score = request != null ? request.getScore() : null;
        AssessmentSessionResponse response = assessmentSessionService.completeMcqStage(id, principal.getId(), interviewId, score);
        return ResponseEntity.ok(ApiResponse.success("MCQ Technical Assessment completed; AI Video Interview unlocked!", response));
    }

    @PostMapping("/{id}/video/start")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> startOrResumeVideoRound(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentSessionResponse response = assessmentSessionService.startOrResumeVideoRound(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("AI Video Interview round started or resumed", response));
    }

    @PostMapping("/{id}/video/complete")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> completeVideoRound(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteVideoStageRequest request
    ) {
        AssessmentSessionResponse response = assessmentSessionService.completeVideoStage(
                id,
                principal.getId(),
                request.getScore(),
                request.getTechnicalScore(),
                request.getCommunicationScore(),
                request.getSentimentLabel(),
                request.getFeedback()
        );
        return ResponseEntity.ok(ApiResponse.success("AI Video Interview completed; Final Combined Report generated!", response));
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<ApiResponse<AssessmentReportResponse>> getFinalReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentReportResponse report = assessmentReportService.getOrCreateReport(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "COMPLETED".equals(report.getStatus()) 
                        ? "Final Combined Assessment Report retrieved" 
                        : "Assessment report retrieved (Incomplete)", 
                report
        ));
    }

    private AssessmentSession toEntitySnapshot(AssessmentSessionResponse resp) {
        AssessmentSession s = new AssessmentSession();
        s.setId(resp.getId());
        s.setResumeStageStatus(resp.getResumeStageStatus());
        s.setResumeScore(resp.getResumeScore());
        s.setMcqStageStatus(resp.getMcqStageStatus());
        s.setMcqScore(resp.getMcqScore());
        s.setVideoStageStatus(resp.getVideoStageStatus());
        s.setVideoScore(resp.getVideoScore());
        s.setCurrentStage(resp.getCurrentStage());
        return s;
    }
}

