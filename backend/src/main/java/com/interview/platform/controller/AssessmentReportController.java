package com.interview.platform.controller;

import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.dto.report.AssessmentReportResponse;
import com.interview.platform.dto.report.ReportHistoryItemDto;
import com.interview.platform.security.UserPrincipal;
import com.interview.platform.service.AssessmentReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assessment-reports")
public class AssessmentReportController {

    private final AssessmentReportService assessmentReportService;

    public AssessmentReportController(AssessmentReportService assessmentReportService) {
        this.assessmentReportService = assessmentReportService;
    }

    /**
     * Retrieves or generates the combined assessment report for an assessment session.
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<AssessmentReportResponse>> getReportBySessionId(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentReportResponse response = assessmentReportService.getOrCreateReport(sessionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Assessment report retrieved", response));
    }

    /**
     * Retrieves a saved report by its report ID. Enforces ownership.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssessmentReportResponse>> getReportById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentReportResponse response = assessmentReportService.getReportById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Assessment report retrieved", response));
    }

    /**
     * Retrieves report history for the authenticated candidate.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportHistoryItemDto>>> getUserReportHistory(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ReportHistoryItemDto> list = assessmentReportService.getUserReportHistory(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Report history retrieved", list));
    }
}

