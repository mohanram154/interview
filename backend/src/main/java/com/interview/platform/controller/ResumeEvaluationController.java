package com.interview.platform.controller;

import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.dto.resume.ResumeEvaluationResponse;
import com.interview.platform.dto.resume.ResumeParseResponse;
import com.interview.platform.dto.resume.SubmitResumeEvaluationRequest;
import com.interview.platform.security.UserPrincipal;
import com.interview.platform.service.ResumeEvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/assessment-sessions/{id}/resume")
public class ResumeEvaluationController {

    private final ResumeEvaluationService resumeEvaluationService;

    public ResumeEvaluationController(ResumeEvaluationService resumeEvaluationService) {
        this.resumeEvaluationService = resumeEvaluationService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ResumeParseResponse>> uploadAndParseResume(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetRole", required = false) String targetRole
    ) {
        ResumeParseResponse response = resumeEvaluationService.uploadAndParseResume(
                id,
                principal.getId(),
                file,
                targetRole
        );
        return ResponseEntity.ok(ApiResponse.success(
                "Resume parsed successfully. Please review and correct the extracted information before final evaluation.",
                response
        ));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<ResumeEvaluationResponse>> evaluateResume(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitResumeEvaluationRequest request
    ) {
        ResumeEvaluationResponse response = resumeEvaluationService.evaluateAndPersist(
                id,
                principal.getId(),
                request
        );
        return ResponseEntity.ok(ApiResponse.success(
                "Resume evaluation completed and score persisted. MCQ Assessment is now unlocked!",
                response
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ResumeEvaluationResponse>> getResumeEvaluation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ResumeEvaluationResponse response = resumeEvaluationService.getEvaluation(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Resume evaluation retrieved", response));
    }
}

