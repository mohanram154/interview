package com.interview.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.platform.client.AiServiceClient;
import com.interview.platform.dto.resume.ResumeEvaluationResponse;
import com.interview.platform.dto.resume.ResumeParseResponse;
import com.interview.platform.dto.resume.SubmitResumeEvaluationRequest;
import com.interview.platform.entity.AssessmentSession;
import com.interview.platform.entity.ResumeEvaluation;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.AssessmentSessionRepository;
import com.interview.platform.repository.ResumeEvaluationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ResumeEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(ResumeEvaluationService.class);

    public static final Set<String> ALLOWED_ROLES = new LinkedHashSet<>(Arrays.asList(
            "Full Stack Developer",
            "Software Developer",
            "Java Developer",
            "Frontend Developer",
            "Backend Developer",
            "Python Developer",
            "Data Analyst",
            "AI/ML Engineer"
    ));

    private final AssessmentSessionRepository assessmentSessionRepository;
    private final ResumeEvaluationRepository resumeEvaluationRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;
    private final long maxFileSize;

    public ResumeEvaluationService(
            AssessmentSessionRepository assessmentSessionRepository,
            ResumeEvaluationRepository resumeEvaluationRepository,
            AiServiceClient aiServiceClient,
            ObjectMapper objectMapper,
            @Value("${app.resume.max-file-size:5242880}") long maxFileSize
    ) {
        this.assessmentSessionRepository = assessmentSessionRepository;
        this.resumeEvaluationRepository = resumeEvaluationRepository;
        this.aiServiceClient = aiServiceClient;
        this.objectMapper = objectMapper;
        this.maxFileSize = maxFileSize;
    }

    /**
     * Validates and parses uploaded resume file (PDF or DOCX).
     * Enforces content inspection, size limits, and returns structured data for candidate review.
     * Keeps MCQ round locked.
     */
    @Transactional
    public ResumeParseResponse uploadAndParseResume(
            Long sessionId,
            Long userId,
            MultipartFile file,
            String targetRole
    ) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        // 1. Validate file constraints
        validateResumeFile(file);

        // 2. Validate target role
        String normalizedRole = validateTargetRole(targetRole != null ? targetRole : session.getJobRole().getName());

        // 3. Mark Resume round as IN_PROGRESS
        session.setResumeStageStatus("IN_PROGRESS");
        session.setResumeFilename(file.getOriginalFilename());
        assessmentSessionRepository.save(session);

        // 4. Delegate to AI service for content extraction
        Map<String, Object> extractedData = aiServiceClient.parseResume(file);

        String fileType = file.getOriginalFilename() != null && file.getOriginalFilename().toLowerCase().endsWith(".docx")
                ? "DOCX" : "PDF";

        return new ResumeParseResponse(
                file.getOriginalFilename(),
                fileType,
                file.getSize(),
                extractedData
        );
    }

    /**
     * Submits candidate-reviewed/corrected resume data, executes role-based evaluation,
     * persists results in MySQL, and unlocks MCQ assessment round.
     * CRITICAL LOCKING RULE: MCQ is only unlocked after persistence succeeds.
     */
    @Transactional
    public ResumeEvaluationResponse evaluateAndPersist(
            Long sessionId,
            Long userId,
            SubmitResumeEvaluationRequest request
    ) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        String normalizedRole = validateTargetRole(request.getTargetRole());

        // Construct AI evaluation payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("parsedResume", request.getCorrectedData());
        payload.put("targetRole", normalizedRole);
        payload.put("companyName", request.getCompanyName());
        payload.put("jobDescription", request.getJobDescription());
        if (request.getCustomWeights() != null) {
            payload.put("customWeights", request.getCustomWeights());
        }

        // Call AI evaluation service
        Map<String, Object> evalResult = aiServiceClient.evaluateResume(payload);

        // Extract scores
        Double overallMatchScore = getDoubleVal(evalResult, "overallMatchScore", 0.0);
        Map<String, Object> breakdown = (Map<String, Object>) evalResult.getOrDefault("breakdown", Collections.emptyMap());

        Double technicalSkillScore = getDoubleVal(breakdown, "technicalSkillScore", 0.0);
        Double projectExperienceScore = getDoubleVal(breakdown, "projectExperienceScore", 0.0);
        Double internshipWorkScore = getDoubleVal(breakdown, "internshipWorkScore", 0.0);
        Double educationCertScore = getDoubleVal(breakdown, "educationCertScore", 0.0);
        Double practicalEvidenceScore = getDoubleVal(breakdown, "practicalEvidenceScore", 0.0);
        Double roleAlignmentScore = getDoubleVal(breakdown, "roleAlignmentScore", 0.0);

        String benchmarkLabel = String.valueOf(evalResult.getOrDefault("evaluationBenchmark", "Standard Industry Benchmark"));
        String benchmarkNote = String.valueOf(evalResult.getOrDefault("benchmarkNote", ""));

        // Persist or update ResumeEvaluation entity
        ResumeEvaluation evalEntity = resumeEvaluationRepository.findByAssessmentSessionId(sessionId)
                .orElse(new ResumeEvaluation());

        evalEntity.setAssessmentSession(session);
        evalEntity.setUser(session.getUser());
        evalEntity.setTargetRole(normalizedRole);
        evalEntity.setCompanyName(request.getCompanyName());
        evalEntity.setJobDescription(request.getJobDescription());
        evalEntity.setCustomJobDescription(request.getJobDescription() != null && !request.getJobDescription().isBlank());
        evalEntity.setResumeFilename(session.getResumeFilename() != null ? session.getResumeFilename() : "Candidate_Resume.pdf");
        evalEntity.setResumeFileSize(evalEntity.getResumeFileSize() != null ? evalEntity.getResumeFileSize() : 1024L);
        evalEntity.setResumeFileType(evalEntity.getResumeFilename().toLowerCase().endsWith(".docx") ? "DOCX" : "PDF");

        evalEntity.setExtractedData(toJsonString(request.getCorrectedData()));
        evalEntity.setCorrectedData(toJsonString(request.getCorrectedData()));

        evalEntity.setOverallMatchScore(overallMatchScore);
        evalEntity.setTechnicalSkillScore(technicalSkillScore);
        evalEntity.setProjectExperienceScore(projectExperienceScore);
        evalEntity.setInternshipWorkScore(internshipWorkScore);
        evalEntity.setEducationCertScore(educationCertScore);
        evalEntity.setPracticalEvidenceScore(practicalEvidenceScore);
        evalEntity.setRoleAlignmentScore(roleAlignmentScore);

        evalEntity.setMatchedSkills(toJsonString(evalResult.get("matchedSkills")));
        evalEntity.setMissingSkills(toJsonString(evalResult.get("missingSkills")));
        evalEntity.setRelevantProjects(toJsonString(evalResult.get("relevantProjects")));
        evalEntity.setStrengths(toJsonString(evalResult.get("strengths")));
        evalEntity.setRequirementsNotEvidenced(toJsonString(evalResult.get("requirementsNotEvidenced")));
        evalEntity.setImprovementSuggestions(toJsonString(evalResult.get("improvementSuggestions")));
        evalEntity.setScoreExplanations(toJsonString(evalResult.get("scoreExplanations")));
        evalEntity.setEvaluationBenchmark(benchmarkLabel);

        ResumeEvaluation savedEval = resumeEvaluationRepository.save(evalEntity);

        // Update AssessmentSession state & unlock Round 2 (MCQ) ONLY after successful persistence
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(overallMatchScore);
        session.setResumeSkillsMatchScore(technicalSkillScore);
        session.setResumeExperienceScore(projectExperienceScore);
        session.setResumeFeedback(String.format(
                "Resume evaluation completed against %s. Match score: %.1f/100 (Technical: %.1f%%, Projects: %.1f%%).",
                benchmarkLabel, overallMatchScore, technicalSkillScore, projectExperienceScore
        ));
        session.setResumeCompletedAt(LocalDateTime.now());

        // CRITICAL UNLOCK RULE: Unlock MCQ Round
        session.setCurrentStage("MCQ_ASSESSMENT");
        if ("LOCKED".equalsIgnoreCase(session.getMcqStageStatus()) || "NOT_STARTED".equalsIgnoreCase(session.getMcqStageStatus())) {
            session.setMcqStageStatus("AVAILABLE");
        }

        assessmentSessionRepository.save(session);

        return mapToResponse(savedEval, benchmarkNote);
    }

    /**
     * Retrieves saved resume evaluation for assessment session.
     */
    @Transactional(readOnly = true)
    public ResumeEvaluationResponse getEvaluation(Long sessionId, Long userId) {
        AssessmentSession session = getSessionEntity(sessionId, userId);
        ResumeEvaluation eval = resumeEvaluationRepository.findByAssessmentSessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume evaluation not found for session ID: " + sessionId));

        return mapToResponse(eval, null);
    }

    /**
     * Strict file validation: MIME, size, magic bytes, emptiness.
     */
    public void validateResumeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a resume file to upload.");
        }

        if (file.getSize() > maxFileSize) {
            long maxMb = maxFileSize / (1024 * 1024);
            throw new BadRequestException("Resume file size exceeds the allowed limit (" + maxMb + " MB).");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Filename is missing.");
        }

        String lowerName = originalFilename.toLowerCase();
        boolean isPdf = lowerName.endsWith(".pdf");
        boolean isDocx = lowerName.endsWith(".docx") || lowerName.endsWith(".doc");

        if (!isPdf && !isDocx) {
            throw new BadRequestException("Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).");
        }

        // Magic bytes inspection
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            int read = is.read(header);
            if (read < 4) {
                throw new BadRequestException("Uploaded file contains insufficient data or is corrupt.");
            }

            if (isPdf) {
                // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
                if (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                    throw new BadRequestException("Invalid PDF format. The file header is corrupted or not a valid PDF document.");
                }
            } else {
                // DOCX magic bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
                if (header[0] != 0x50 || header[1] != 0x4B || header[2] != 0x03 || header[3] != 0x04) {
                    throw new BadRequestException("Invalid DOCX format. The file header is corrupted or not a valid Word document.");
                }
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file: " + e.getMessage());
        }
    }

    /**
     * Validates target role against the 8 allowed mandatory roles.
     */
    public String validateTargetRole(String targetRole) {
        if (targetRole == null || targetRole.isBlank()) {
            return "Software Developer";
        }

        String trimmed = targetRole.trim();
        for (String role : ALLOWED_ROLES) {
            if (role.equalsIgnoreCase(trimmed)) {
                return role;
            }
        }

        // Match fuzzy
        String lower = trimmed.toLowerCase();
        if (lower.contains("full stack") || lower.contains("fullstack")) return "Full Stack Developer";
        if (lower.contains("java")) return "Java Developer";
        if (lower.contains("python")) return "Python Developer";
        if (lower.contains("frontend") || lower.contains("front-end")) return "Frontend Developer";
        if (lower.contains("backend") || lower.contains("back-end")) return "Backend Developer";
        if (lower.contains("data") || lower.contains("analyst")) return "Data Analyst";
        if (lower.contains("ai") || lower.contains("ml") || lower.contains("machine learning")) return "AI/ML Engineer";

        return "Software Developer";
    }

    private AssessmentSession getSessionEntity(Long sessionId, Long userId) {
        AssessmentSession session = assessmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to access this assessment session.");
        }

        return session;
    }

    private String toJsonString(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T fromJsonString(String json, Class<T> clazz) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private ResumeEvaluationResponse mapToResponse(ResumeEvaluation eval, String benchmarkNote) {
        ResumeEvaluationResponse resp = new ResumeEvaluationResponse();
        resp.setId(eval.getId());
        resp.setAssessmentSessionId(eval.getAssessmentSession().getId());
        resp.setTargetRole(eval.getTargetRole());
        resp.setCompanyName(eval.getCompanyName());
        resp.setCustomJobDescription(eval.isCustomJobDescription());
        resp.setResumeFilename(eval.getResumeFilename());
        resp.setResumeFileType(eval.getResumeFileType());
        resp.setResumeFileSize(eval.getResumeFileSize());

        resp.setOverallMatchScore(eval.getOverallMatchScore());
        resp.setTechnicalSkillScore(eval.getTechnicalSkillScore());
        resp.setProjectExperienceScore(eval.getProjectExperienceScore());
        resp.setInternshipWorkScore(eval.getInternshipWorkScore());
        resp.setEducationCertScore(eval.getEducationCertScore());
        resp.setPracticalEvidenceScore(eval.getPracticalEvidenceScore());
        resp.setRoleAlignmentScore(eval.getRoleAlignmentScore());

        resp.setMatchedSkills(fromJsonString(eval.getMatchedSkills(), List.class));
        resp.setMissingSkills(fromJsonString(eval.getMissingSkills(), List.class));
        resp.setRelevantProjects(fromJsonString(eval.getRelevantProjects(), List.class));
        resp.setStrengths(fromJsonString(eval.getStrengths(), List.class));
        resp.setRequirementsNotEvidenced(fromJsonString(eval.getRequirementsNotEvidenced(), List.class));
        resp.setImprovementSuggestions(fromJsonString(eval.getImprovementSuggestions(), List.class));
        resp.setScoreExplanations(fromJsonString(eval.getScoreExplanations(), Map.class));

        resp.setExtractedData(fromJsonString(eval.getExtractedData(), Map.class));
        resp.setCorrectedData(fromJsonString(eval.getCorrectedData(), Map.class));

        resp.setEvaluationBenchmark(eval.getEvaluationBenchmark());
        resp.setBenchmarkNote(benchmarkNote != null ? benchmarkNote : (eval.isCustomJobDescription()
                ? "Evaluated against custom job requirements."
                : "Evaluated against standard industry profile. This evaluation does not claim internal company hiring criteria."));
        resp.setCompletedAt(eval.getUpdatedAt());

        return resp;
    }

    private Double getDoubleVal(Map<String, Object> map, String key, Double defaultVal) {
        Object val = map.get(key);
        if (val instanceof Number) {
            return ((Number) val).doubleValue();
        }
        return defaultVal;
    }
}
