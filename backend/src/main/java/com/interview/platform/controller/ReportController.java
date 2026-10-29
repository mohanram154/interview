package com.interview.platform.controller;

import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.dto.interview.ReportResponse;
import com.interview.platform.security.UserPrincipal;
import com.interview.platform.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ReportResponse>>> getReportHistory(@AuthenticationPrincipal UserPrincipal principal) {
        List<ReportResponse> reports = reportService.getUserReportHistory(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Candidate report history retrieved", reports));
    }
}

