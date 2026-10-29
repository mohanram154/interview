package com.interview.platform.controller;

import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.VideoConsentRequest;
import com.interview.platform.dto.assessment.VideoInterviewStatusResponse;
import com.interview.platform.dto.assessment.VideoQuestionDto;
import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.security.UserPrincipal;
import com.interview.platform.service.VideoInterviewService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/assessment-sessions/{sessionId}/video")
public class VideoInterviewController {

    private final VideoInterviewService videoInterviewService;

    public VideoInterviewController(VideoInterviewService videoInterviewService) {
        this.videoInterviewService = videoInterviewService;
    }

    /**
     * Records candidate consent for AI speech/audio evaluation and initializes questions.
     * Enforces prerequisite check: Rounds 1 & 2 must be completed.
     */
    @PostMapping("/consent")
    public ResponseEntity<ApiResponse<VideoInterviewStatusResponse>> recordConsent(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VideoConsentRequest request
    ) {
        VideoInterviewStatusResponse status = videoInterviewService.recordConsent(sessionId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Candidate consent recorded successfully. Video interview unlocked.", status));
    }

    /**
     * Gets current video interview session status, consent state, and questions.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<VideoInterviewStatusResponse>> getStatus(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VideoInterviewStatusResponse status = videoInterviewService.getStatus(sessionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Video interview status retrieved.", status));
    }

    /**
     * Retrieves or generates 5–8 tailored video interview questions.
     */
    @GetMapping("/questions")
    public ResponseEntity<ApiResponse<List<VideoQuestionDto>>> getQuestions(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<VideoQuestionDto> questions = videoInterviewService.getOrGenerateQuestions(sessionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Video interview questions retrieved.", questions));
    }

    /**
     * Uploads candidate video answer recording for a specific question.
     * Enforces size (max 50MB), MIME check, user ownership, and private storage.
     */
    @PostMapping("/questions/{questionId}/upload")
    public ResponseEntity<ApiResponse<VideoQuestionDto>> uploadRecording(
            @PathVariable Long sessionId,
            @PathVariable Long questionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "duration", required = false) Integer durationSeconds,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VideoQuestionDto dto = videoInterviewService.uploadQuestionRecording(
                sessionId,
                principal.getId(),
                questionId,
                file,
                durationSeconds
        );
        return ResponseEntity.ok(ApiResponse.success("Recording uploaded and saved successfully.", dto));
    }

    /**
     * Authenticated endpoint to stream candidate's recorded answer.
     * Strictly verifies ownership; no public access.
     */
    @GetMapping("/questions/{questionId}/stream")
    public ResponseEntity<Resource> streamRecording(
            @PathVariable Long sessionId,
            @PathVariable Long questionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Map<String, Object> data = videoInterviewService.getRecordingResource(sessionId, principal.getId(), questionId);
        Resource resource = (Resource) data.get("resource");
        String mimeType = (String) data.get("mimeType");
        String filename = (String) data.get("filename");
        long size = (long) data.get("size");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-cache, no-store, must-revalidate")
                .contentType(MediaType.parseMediaType(mimeType))
                .contentLength(size)
                .body(resource);
    }

    /**
     * Submits and completes Round 3 (AI Video Interview).
     * Calculates scores, updates status, and unlocks Final Report.
     */
    @PostMapping("/finish")
    public ResponseEntity<ApiResponse<AssessmentSessionResponse>> finishInterview(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AssessmentSessionResponse response = videoInterviewService.finishVideoInterview(sessionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Round 3 (AI Video Interview) successfully evaluated and completed!", response));
    }
}
