package com.interview.platform.controller;

import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.CreateAssessmentSessionRequest;
import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.entity.AssessmentSession;
import com.interview.platform.security.UserPrincipal;
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

    public AssessmentSessionController(AssessmentSessionService assessmentSessionService) {
        this.assessmentSessionService = assessmentSessionService;
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
