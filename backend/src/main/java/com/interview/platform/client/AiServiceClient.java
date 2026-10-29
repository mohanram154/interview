package com.interview.platform.client;

import com.interview.platform.dto.ai.AiEvaluationRequest;
import com.interview.platform.dto.ai.AiEvaluationResponse;
import com.interview.platform.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.*;

@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public AiServiceClient(
            RestTemplateBuilder builder,
            @Value("${app.ai-service.url:http://localhost:8000}") String baseUrl,
            @Value("${app.ai-service.timeout-ms:15000}") long timeoutMs
    ) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofMillis(timeoutMs))
                .setReadTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    public AiEvaluationResponse evaluateAnswer(AiEvaluationRequest request) {
        String url = baseUrl + "/internal/evaluate";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AiEvaluationRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<AiEvaluationResponse> response = restTemplate.postForEntity(url, entity, AiEvaluationResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("AI Service call to {} failed: {}. Executing local fallback evaluator.", url, e.getMessage());
        }

        // Safe deterministic baseline fallback evaluator
        return calculateBaselineFallback(request);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parseResume(MultipartFile file) {
        String url = baseUrl + "/internal/resume/parse";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
                }
            };
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody().get("data");
            }
        } catch (HttpStatusCodeException e) {
            String errorResponse = e.getResponseBodyAsString();
            log.error("AI service resume parse failed: status={}, body={}", e.getStatusCode(), errorResponse);
            throw new BadRequestException(extractErrorMessage(errorResponse, "Failed to parse resume: " + e.getMessage()));
        } catch (Exception e) {
            log.error("AI service resume parse call error: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to process resume file: " + e.getMessage());
        }
        throw new BadRequestException("AI service returned empty response during resume parsing.");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> evaluateResume(Map<String, Object> payload) {
        String url = baseUrl + "/internal/resume/evaluate";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody().get("data");
            }
        } catch (HttpStatusCodeException e) {
            String errorResponse = e.getResponseBodyAsString();
            log.error("AI service resume evaluate failed: status={}, body={}", e.getStatusCode(), errorResponse);
            throw new BadRequestException(extractErrorMessage(errorResponse, "Failed to evaluate resume: " + e.getMessage()));
        } catch (Exception e) {
            log.error("AI service resume evaluate call error: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to evaluate resume: " + e.getMessage());
        }
        throw new BadRequestException("AI service returned empty response during resume evaluation.");
    }

    private String extractErrorMessage(String responseBody, String defaultMsg) {
        if (responseBody != null && responseBody.contains("\"detail\"")) {
            try {
                int start = responseBody.indexOf("\"detail\":");
                if (start != -1) {
                    String sub = responseBody.substring(start + 9).trim();
                    if (sub.startsWith("\"")) {
                        int end = sub.indexOf("\"", 1);
                        if (end != -1) {
                            return sub.substring(1, end);
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return defaultMsg;
    }

    public Map<String, Object> analyzeVideoRecording(MultipartFile file, String transcript, String targetRole) {
        String url = baseUrl + "/internal/video/analyze-recording";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "recording.webm";
                }
            });
            if (transcript != null && !transcript.isBlank()) {
                body.add("transcript", transcript);
            }
            if (targetRole != null && !targetRole.isBlank()) {
                body.add("target_role", targetRole);
            }

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody().get("data");
            }
        } catch (Exception e) {
            log.warn("AI Service call to {} failed: {}. Continuing with standard recording persistence.", url, e.getMessage());
        }
        return Collections.emptyMap();
    }

    private AiEvaluationResponse calculateBaselineFallback(AiEvaluationRequest request) {
        String answer = request.getAnswerText() != null ? request.getAnswerText().trim() : "";
        String topics = request.getExpectedTopics() != null ? request.getExpectedTopics().toLowerCase() : "";

        String[] expectedKeywords = topics.split("[,\\s]+");
        List<String> foundKeywords = new ArrayList<>();
        String lowerAnswer = answer.toLowerCase();

        for (String kw : expectedKeywords) {
            kw = kw.trim();
            if (kw.length() > 2 && lowerAnswer.contains(kw)) {
                foundKeywords.add(kw);
            }
        }

        int wordCount = answer.isEmpty() ? 0 : answer.split("\\s+").length;

        double keywordRatio = expectedKeywords.length > 0 ? (double) foundKeywords.size() / Math.max(1, expectedKeywords.length) : 0.5;
        double technicalAccuracy = Math.min(100.0, Math.max(20.0, keywordRatio * 90.0 + 10.0));
        double relevance = Math.min(100.0, Math.max(30.0, (foundKeywords.size() > 0 ? 50.0 : 25.0) + Math.min(45.0, wordCount * 0.8)));
        double completeness = Math.min(100.0, Math.max(15.0, Math.min(100.0, wordCount * 1.5)));
        double clarity = wordCount > 15 ? 80.0 : 50.0;

        double overall = (technicalAccuracy * 0.40) + (relevance * 0.25) + (completeness * 0.20) + (clarity * 0.15);
        overall = Math.round(overall * 10.0) / 10.0;

        AiEvaluationResponse response = new AiEvaluationResponse();
        response.setTechnicalAccuracyScore(Math.round(technicalAccuracy * 10.0) / 10.0);
        response.setRelevanceScore(Math.round(relevance * 10.0) / 10.0);
        response.setCompletenessScore(Math.round(completeness * 10.0) / 10.0);
        response.setClarityScore(Math.round(clarity * 10.0) / 10.0);
        response.setOverallScore(overall);
        response.setSentimentLabel("NEUTRAL");
        response.setSentimentConfidence(0.85);

        List<String> strengths = new ArrayList<>();
        if (!foundKeywords.isEmpty()) {
            strengths.add("Demonstrated foundational understanding by mentioning key terms: " + String.join(", ", foundKeywords));
        } else {
            strengths.add("Attempted answer structure and core vocabulary.");
        }
        response.setStrengths(strengths);

        List<String> improvements = new ArrayList<>();
        if (foundKeywords.size() < expectedKeywords.length) {
            improvements.add("Incorporate deeper architectural details and edge-case considerations into the explanation.");
        }
        improvements.add("Structure technical answers using explicit principles, implementation trade-offs, and concrete examples.");
        response.setImprovements(improvements);

        response.setFeedback(String.format("Response evaluated using standard competency metrics. Identified %d matching technical concepts with an overall assessment of %.1f/100.", foundKeywords.size(), overall));
        return response;
    }
}
