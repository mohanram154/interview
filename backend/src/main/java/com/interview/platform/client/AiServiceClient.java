package com.interview.platform.client;

import com.interview.platform.dto.ai.AiEvaluationRequest;
import com.interview.platform.dto.ai.AiEvaluationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

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
            @Value("${app.ai-service.timeout-ms:10000}") long timeoutMs
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

        // Technical accuracy based on keyword coverage
        double keywordRatio = expectedKeywords.length > 0 ? (double) foundKeywords.size() / Math.max(1, expectedKeywords.length) : 0.5;
        double technicalAccuracy = Math.min(100.0, Math.max(20.0, keywordRatio * 90.0 + 10.0));

        // Relevance based on answer length and keywords
        double relevance = Math.min(100.0, Math.max(30.0, (foundKeywords.size() > 0 ? 50.0 : 25.0) + Math.min(45.0, wordCount * 0.8)));

        // Completeness based on length and depth
        double completeness = Math.min(100.0, Math.max(15.0, Math.min(100.0, wordCount * 1.5)));

        // Clarity based on sentence structure
        double clarity = wordCount > 15 ? 80.0 : 50.0;

        // Weighted formula: 40% technical, 25% relevance, 20% completeness, 15% clarity
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
        }
        if (wordCount > 30) {
            strengths.add("Provided a structured and substantive explanation.");
        } else {
            strengths.add("Clear and concise response.");
        }
        response.setStrengths(strengths);

        List<String> improvements = new ArrayList<>();
        if (foundKeywords.size() < expectedKeywords.length) {
            improvements.add("Incorporate more domain-specific technical terminology and expected architecture concepts.");
        }
        if (wordCount < 40) {
            improvements.add("Elaborate further with real-world implementation examples and edge cases.");
        }
        response.setImprovements(improvements);

        response.setFeedback("Baseline NLP evaluation completed. Answer scored " + overall + "/100 based on keyword coverage and structural depth.");
        response.setEvaluationMethod("BASELINE_FALLBACK");
        response.setEvaluationStatus("COMPLETED");

        return response;
    }
}
