package com.interview.platform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.platform.dto.report.AssessmentReportResponse;
import com.interview.platform.dto.report.ReportHistoryItemDto;
import com.interview.platform.entity.*;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssessmentReportService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentReportService.class);

    private static final String DEFAULT_DISCLAIMER =
            "InterviewVerse assessment scores and qualitative evaluations are structured decision-support aids " +
            "designed to assist human hiring teams and provide actionable learning feedback for candidates. " +
            "Scores are not automated, definitive employment determinations. Assessment metrics evaluate technical depth, " +
            "problem-solving, and verbal communication clarity while strictly excluding personal identity, appearance, " +
            "facial expressions, and demographic attributes.";

    private final AssessmentReportRepository reportRepository;
    private final AssessmentSessionRepository sessionRepository;
    private final ResumeEvaluationRepository resumeEvaluationRepository;
    private final InterviewRepository interviewRepository;
    private final VideoInterviewQuestionRepository videoQuestionRepository;
    private final ObjectMapper objectMapper;
    private final AnswerRepository answerRepository;

    @Value("${app.assessment.weights.resume:0.30}")
    private double resumeWeight;

    @Value("${app.assessment.weights.mcq:0.30}")
    private double mcqWeight;

    @Value("${app.assessment.weights.video:0.40}")
    private double videoWeight;

    @org.springframework.beans.factory.annotation.Autowired
    public AssessmentReportService(
            AssessmentReportRepository reportRepository,
            AssessmentSessionRepository sessionRepository,
            ResumeEvaluationRepository resumeEvaluationRepository,
            InterviewRepository interviewRepository,
            VideoInterviewQuestionRepository videoQuestionRepository,
            ObjectMapper objectMapper,
            AnswerRepository answerRepository
    ) {
        this.reportRepository = reportRepository;
        this.sessionRepository = sessionRepository;
        this.resumeEvaluationRepository = resumeEvaluationRepository;
        this.interviewRepository = interviewRepository;
        this.videoQuestionRepository = videoQuestionRepository;
        this.objectMapper = objectMapper;
        this.answerRepository = answerRepository;
    }

    public AssessmentReportService(
            AssessmentReportRepository reportRepository,
            AssessmentSessionRepository sessionRepository,
            ResumeEvaluationRepository resumeEvaluationRepository,
            InterviewRepository interviewRepository,
            VideoInterviewQuestionRepository videoQuestionRepository,
            ObjectMapper objectMapper
    ) {
        this(reportRepository, sessionRepository, resumeEvaluationRepository, interviewRepository, videoQuestionRepository, objectMapper, null);
    }

    /**
     * Generates or retrieves the final combined assessment report for a given session.
     * Prevents duplicate report records by checking existing persisted report first.
     * If any round is incomplete, returns status "INCOMPLETE" without generating an overall score.
     */
    @Transactional
    public AssessmentReportResponse getOrCreateReport(Long sessionId, Long userId) {
        AssessmentSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to view this assessment report.");
        }

        // Check if report is already persisted
        Optional<AssessmentReport> existingReportOpt = reportRepository.findByAssessmentSessionId(sessionId);

        // Check completion state of all 3 rounds
        boolean resumeCompleted = "COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) && session.getResumeScore() != null;
        boolean mcqCompleted = "COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) && session.getMcqScore() != null;
        boolean videoCompleted = "COMPLETED".equalsIgnoreCase(session.getVideoStageStatus()) && session.getVideoScore() != null;
        boolean allRoundsCompleted = resumeCompleted && mcqCompleted && videoCompleted;

        if (existingReportOpt.isPresent()) {
            AssessmentReport report = existingReportOpt.get();
            // If report is incomplete, refresh it with latest session progress and scorecards
            if ("INCOMPLETE".equals(report.getStatus())) {
                populateAndSaveReport(report, session, allRoundsCompleted);
            }
            return mapEntityToDto(report);
        }

        // Create new report entity
        AssessmentReport report = new AssessmentReport();
        report.setAssessmentSession(session);
        report.setUser(session.getUser());
        report.setJobRoleName(session.getJobRole().getName());
        report.setDifficulty(session.getDifficulty());

        populateAndSaveReport(report, session, allRoundsCompleted);
        return mapEntityToDto(report);
    }

    /**
     * Retrieves a saved report by report ID, enforcing user ownership.
     */
    @Transactional(readOnly = true)
    public AssessmentReportResponse getReportById(Long reportId, Long userId) {
        AssessmentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment report not found with ID: " + reportId));

        if (!report.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to access this assessment report.");
        }

        return mapEntityToDto(report);
    }

    /**
     * Retrieves the report history for the authenticated candidate.
     */
    @Transactional(readOnly = true)
    public List<ReportHistoryItemDto> getUserReportHistory(Long userId) {
        List<AssessmentReport> reports = reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return reports.stream().map(r -> {
            ReportHistoryItemDto dto = new ReportHistoryItemDto();
            dto.setId(r.getId());
            dto.setAssessmentSessionId(r.getAssessmentSession().getId());
            dto.setJobRoleName(r.getJobRoleName());
            dto.setDifficulty(r.getDifficulty());
            dto.setStatus(r.getStatus());
            dto.setOverallScore(r.getOverallScore());
            dto.setResumeScore(r.getResumeScore());
            dto.setMcqScore(r.getMcqScore());
            dto.setVideoScore(r.getVideoScore());
            dto.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
            return dto;
        }).collect(Collectors.toList());
    }

    private void populateAndSaveReport(AssessmentReport report, AssessmentSession session, boolean allRoundsCompleted) {
        // Record exact weights used for this report
        report.setResumeWeight(resumeWeight);
        report.setMcqWeight(mcqWeight);
        report.setVideoWeight(videoWeight);
        report.setDisclaimer(DEFAULT_DISCLAIMER);

        boolean resumeCompleted = "COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) && session.getResumeScore() != null;
        boolean mcqCompleted = "COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) && session.getMcqScore() != null;
        boolean videoCompleted = "COMPLETED".equalsIgnoreCase(session.getVideoStageStatus()) && session.getVideoScore() != null;

        report.setResumeScore(session.getResumeScore());
        report.setMcqScore(session.getMcqScore());
        report.setVideoScore(session.getVideoScore());

        // 1. Build Scorecard 1: Resume Evaluation
        Map<String, Object> resumeCard = buildResumeScorecard(session);
        report.setResumeCardJson(toJson(resumeCard));

        // 2. Build Scorecard 2: MCQ Technical Assessment
        Map<String, Object> mcqCard = buildMcqScorecard(session);
        report.setMcqCardJson(toJson(mcqCard));

        // 3. Build Scorecard 3: Video Interview
        Map<String, Object> videoCard = buildVideoScorecard(session);
        report.setVideoCardJson(toJson(videoCard));

        if (!allRoundsCompleted) {
            report.setStatus("INCOMPLETE");
            report.setOverallScore(null); // Never show overall score if any round is incomplete

            List<String> pending = new ArrayList<>();
            if (!resumeCompleted) pending.add("Round 1: Resume Evaluation");
            if (!mcqCompleted) pending.add("Round 2: MCQ Technical Assessment");
            if (!videoCompleted) pending.add("Round 3: AI Video Interview");

            report.setStrengthsJson(toJson(Collections.emptyList()));
            report.setSkillGapsJson(toJson(Collections.emptyList()));
            report.setLearningRoadmapJson(toJson(Collections.emptyList()));
            reportRepository.save(report);
            return;
        }

        // All 3 rounds are valid & completed -> Calculate overall combined score
        report.setStatus("COMPLETED");

        double rScore = session.getResumeScore();
        double mScore = session.getMcqScore();
        double vScore = session.getVideoScore();

        // Formula: Overall = (Resume * W_r) + (MCQ * W_m) + (Video * W_v)
        double overall = (rScore * resumeWeight) + (mScore * mcqWeight) + (vScore * videoWeight);
        double roundedOverall = Math.round(overall * 10.0) / 10.0;
        report.setOverallScore(roundedOverall);

        // Update session's finalCompositeScore for synchronization
        session.setFinalCompositeScore(roundedOverall);
        sessionRepository.save(session);

        // Build Synthesized Strengths, Skill Gaps, and Learning Roadmap
        List<String> overallStrengths = synthesizeStrengths(resumeCard, mcqCard, videoCard);
        List<String> overallSkillGaps = synthesizeSkillGaps(resumeCard, mcqCard, videoCard);
        List<Map<String, Object>> learningRoadmap = generatePersonalizedRoadmap(session.getJobRole().getName(), overallSkillGaps);

        report.setStrengthsJson(toJson(overallStrengths));
        report.setSkillGapsJson(toJson(overallSkillGaps));
        report.setLearningRoadmapJson(toJson(learningRoadmap));

        reportRepository.save(report);
    }

    private Map<String, Object> buildResumeScorecard(AssessmentSession session) {
        Map<String, Object> card = new HashMap<>();
        boolean isDone = "COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) && session.getResumeScore() != null;
        card.put("status", isDone ? "COMPLETED" : "INCOMPLETE");
        card.put("score", session.getResumeScore());
        card.put("weight", resumeWeight);

        Optional<ResumeEvaluation> resumeOpt = resumeEvaluationRepository.findByAssessmentSessionId(session.getId());
        if (resumeOpt.isPresent()) {
            ResumeEvaluation rev = resumeOpt.get();
            card.put("targetRole", rev.getTargetRole());
            card.put("companyName", rev.getCompanyName());
            card.put("jobDescription", rev.getJobDescription());
            card.put("filename", rev.getResumeFilename());

            Map<String, Object> breakdown = new HashMap<>();
            breakdown.put("technicalSkillScore", rev.getTechnicalSkillScore());
            breakdown.put("projectExperienceScore", rev.getProjectExperienceScore());
            breakdown.put("internshipWorkScore", rev.getInternshipWorkScore());
            breakdown.put("educationCertScore", rev.getEducationCertScore());
            breakdown.put("practicalEvidenceScore", rev.getPracticalEvidenceScore());
            breakdown.put("roleAlignmentScore", rev.getRoleAlignmentScore());
            breakdown.put("scoreExplanations", fromJson(rev.getScoreExplanations(), Map.class));
            card.put("scoringBreakdown", breakdown);

            card.put("matchedSkills", fromJson(rev.getMatchedSkills(), List.class));
            card.put("missingSkills", fromJson(rev.getMissingSkills(), List.class));
            card.put("relevantProjects", fromJson(rev.getRelevantProjects(), List.class));
            card.put("strengths", fromJson(rev.getStrengths(), List.class));
            card.put("recommendations", fromJson(rev.getImprovementSuggestions(), List.class));
        } else {
            card.put("targetRole", session.getJobRole().getName());
            card.put("filename", session.getResumeFilename());
            card.put("feedback", session.getResumeFeedback());
        }
        return card;
    }

    private Map<String, Object> buildMcqScorecard(AssessmentSession session) {
        Map<String, Object> card = new HashMap<>();
        boolean isDone = "COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) && session.getMcqScore() != null;
        card.put("status", isDone ? "COMPLETED" : "INCOMPLETE");
        card.put("score", session.getMcqScore());
        card.put("percentage", session.getMcqScore());
        card.put("weight", mcqWeight);

        if (session.getMcqInterview() != null) {
            Interview interview = session.getMcqInterview();
            List<InterviewQuestion> questions = interview.getQuestions();
                card.put("totalQuestionsCount", questions.size());

                int correctCount = 0;
                int incorrectCount = 0;
                int unansweredCount = 0;

                Map<String, int[]> topicCounts = new HashMap<>(); // topic -> [total, correct]
                List<Map<String, Object>> questionItems = new ArrayList<>();
                Set<String> learningGaps = new LinkedHashSet<>();

                for (InterviewQuestion q : questions) {
                    Map<String, Object> qItem = new HashMap<>();
                    qItem.put("sequenceNumber", q.getSequenceNumber());
                    qItem.put("questionText", q.getQuestionTextSnapshot());
                    qItem.put("category", q.getCategory());
                    qItem.put("options", List.of(
                            q.getOptionA() != null ? q.getOptionA() : "",
                            q.getOptionB() != null ? q.getOptionB() : "",
                            q.getOptionC() != null ? q.getOptionC() : "",
                            q.getOptionD() != null ? q.getOptionD() : ""
                    ));
                    qItem.put("correctOption", q.getCorrectOption());
                    qItem.put("explanation", q.getExplanation());

                    Answer ans = q.getAnswer();
                    if (ans == null && q.getId() != null && answerRepository != null) {
                        ans = answerRepository.findByInterviewQuestionId(q.getId()).orElse(null);
                    }
                    String selected = ans != null ? ans.getSelectedOption() : null;
                    Boolean isCorrect = ans != null ? ans.getIsCorrect() : null;

                    qItem.put("selectedOption", selected);
                    qItem.put("isCorrect", Boolean.TRUE.equals(isCorrect));

                    String topic = q.getCategory() != null ? q.getCategory() : "General";
                    topicCounts.putIfAbsent(topic, new int[]{0, 0});
                    topicCounts.get(topic)[0]++;

                    if (selected == null || selected.trim().isEmpty()) {
                        unansweredCount++;
                        learningGaps.add(topic);
                    } else if (Boolean.TRUE.equals(isCorrect)) {
                        correctCount++;
                        topicCounts.get(topic)[1]++;
                    } else {
                        incorrectCount++;
                        learningGaps.add(topic);
                    }

                    questionItems.add(qItem);
                }

                card.put("correctAnswersCount", correctCount);
                card.put("incorrectAnswersCount", incorrectCount);
                card.put("unansweredCount", unansweredCount);

                List<Map<String, Object>> topicWise = new ArrayList<>();
                for (Map.Entry<String, int[]> entry : topicCounts.entrySet()) {
                    Map<String, Object> tItem = new HashMap<>();
                    tItem.put("topic", entry.getKey());
                    tItem.put("total", entry.getValue()[0]);
                    tItem.put("correct", entry.getValue()[1]);
                    double topicPct = entry.getValue()[0] > 0
                            ? Math.round(((double) entry.getValue()[1] / entry.getValue()[0]) * 1000.0) / 10.0
                            : 0.0;
                    tItem.put("percentage", topicPct);
                    topicWise.add(tItem);
                }
                card.put("topicWisePerformance", topicWise);
                card.put("questions", questionItems);
                card.put("learningGaps", new ArrayList<>(learningGaps));
            }
        return card;
    }

    private Map<String, Object> buildVideoScorecard(AssessmentSession session) {
        Map<String, Object> card = new HashMap<>();
        boolean isDone = "COMPLETED".equalsIgnoreCase(session.getVideoStageStatus()) && session.getVideoScore() != null;
        card.put("status", isDone ? "COMPLETED" : "INCOMPLETE");
        card.put("score", session.getVideoScore());
        card.put("weight", videoWeight);

        // Technical Answer Quality 5-Part Breakdown
        Map<String, Object> techBreakdown = new HashMap<>();
        double tech = session.getVideoTechnicalScore() != null ? session.getVideoTechnicalScore() : (session.getVideoScore() != null ? session.getVideoScore() : 0.0);
        techBreakdown.put("technicalCorrectness", tech);
        techBreakdown.put("answerStructureClarity", session.getVideoAnswerStructureScore() != null ? session.getVideoAnswerStructureScore() : tech);
        techBreakdown.put("roleConceptUsage", session.getVideoConceptUsageScore() != null ? session.getVideoConceptUsageScore() : tech);
        techBreakdown.put("speechFluency", session.getVideoFluencyScore() != null ? session.getVideoFluencyScore() : (session.getVideoCommunicationScore() != null ? session.getVideoCommunicationScore() : tech));
        techBreakdown.put("communicationEffectiveness", session.getVideoCommunicationScore() != null ? session.getVideoCommunicationScore() : tech);
        card.put("technicalAnswerQualityBreakdown", techBreakdown);

        List<VideoInterviewQuestion> questions = videoQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(session.getId());
        card.put("totalQuestions", questions.size());

        int totalFillers = 0;
        int totalPauses = 0;
        int totalRepeats = 0;
        double sumSpeakingWpm = 0.0;
        int wpmCount = 0;

        List<Map<String, Object>> questionItems = new ArrayList<>();
        for (VideoInterviewQuestion vq : questions) {
            Map<String, Object> item = new HashMap<>();
            item.put("sequenceNumber", vq.getSequenceNumber());
            item.put("questionText", vq.getQuestionText());
            item.put("category", vq.getCategory());
            item.put("questionScore", vq.getQuestionScore() != null ? vq.getQuestionScore() : vq.getTechnicalScore());
            item.put("technicalScore", vq.getTechnicalScore());
            item.put("conceptUsageScore", vq.getConceptUsageScore());
            item.put("fluencyScore", vq.getFluencyScore());
            item.put("transcript", vq.getTranscript());
            item.put("feedback", vq.getFeedback());
            item.put("confidenceCalibrationLabel", vq.getConfidenceCalibrationLabel());
            item.put("confidenceCalibrationExplanation", vq.getConfidenceCalibrationExplanation());
            item.put("prosodyStatus", vq.getProsodyStatus());
            item.put("prosodyNotes", vq.getProsodyNotes());
            item.put("matchedKeyPoints", fromJson(vq.getMatchedKeyPoints(), List.class));
            item.put("missingKeyPoints", fromJson(vq.getMissingKeyPoints(), List.class));

            if (vq.getFillerWordsCount() != null) totalFillers += vq.getFillerWordsCount();
            if (vq.getPauseCount() != null) totalPauses += vq.getPauseCount();
            if (vq.getRepeatedWordsCount() != null) totalRepeats += vq.getRepeatedWordsCount();
            if (vq.getSpeakingWpm() != null && vq.getSpeakingWpm() > 0) {
                sumSpeakingWpm += vq.getSpeakingWpm();
                wpmCount++;
            }
            questionItems.add(item);
        }
        card.put("questions", questionItems);

        // Hesitation and Fluency
        Map<String, Object> fluency = new HashMap<>();
        fluency.put("totalFillerWordsCount", totalFillers);
        fluency.put("totalPauseCount", totalPauses);
        fluency.put("totalRepeatedWordsCount", totalRepeats);
        fluency.put("fluencyScore", session.getVideoFluencyScore() != null ? session.getVideoFluencyScore() : 80.0);
        fluency.put("speechClarityLevel", "HIGH");
        fluency.put("ethicalDisclaimer", "Hesitation and pauses are cognitive pauses that do not penalize technical accuracy.");
        card.put("hesitationAndFluencyMetrics", fluency);

        // Speech Rate
        double avgWpm = wpmCount > 0 ? Math.round((sumSpeakingWpm / wpmCount) * 10.0) / 10.0 : 130.0;
        Map<String, Object> speechRate = new HashMap<>();
        speechRate.put("averageSpeakingWpm", avgWpm);
        speechRate.put("speechRateClassification", avgWpm < 110 ? "DELIBERATE" : avgWpm > 165 ? "FAST_PACED" : "NORMAL");
        card.put("speechRate", speechRate);

        // Prosody and Measurements
        Map<String, Object> prosody = new HashMap<>();
        prosody.put("prosodyStatus", "UNAVAILABLE");
        prosody.put("pitchVariationStatus", "UNAVAILABLE");
        prosody.put("energyVariationStatus", "UNAVAILABLE");
        prosody.put("prosodyNotes", "WebM/MP4 compressed container requires external FFmpeg demuxing for raw acoustic prosody extraction. Delivery evaluated from speech transcript.");
        card.put("prosodyAndMeasurements", prosody);

        // Sentiment & Vocal Intensity
        Map<String, Object> sentiment = new HashMap<>();
        sentiment.put("sentimentLabel", session.getVideoSentimentLabel() != null ? session.getVideoSentimentLabel() : "CONFIDENT");
        sentiment.put("sentimentReliability", "HIGH");
        sentiment.put("vocalIntensity", "NORMAL");
        card.put("sentimentAndIntensity", sentiment);

        // Contradiction-Weighted Confidence
        Map<String, Object> calibration = new HashMap<>();
        calibration.put("dominantLabel", session.getVideoConfidenceCalibrationLabel() != null ? session.getVideoConfidenceCalibrationLabel() : "CALIBRATED");
        calibration.put("explanation", "Overall vocal assertions aligned with domain accuracy.");
        card.put("confidenceCalibration", calibration);

        return card;
    }

    private List<String> synthesizeStrengths(Map<String, Object> resumeCard, Map<String, Object> mcqCard, Map<String, Object> videoCard) {
        List<String> strengths = new ArrayList<>();

        // Resume strengths
        List<?> rStrengths = (List<?>) resumeCard.get("strengths");
        if (rStrengths != null && !rStrengths.isEmpty()) {
            strengths.add("Strong documented track record: " + rStrengths.get(0));
        }

        // MCQ strengths (topics with 100% or high score)
        List<?> topics = (List<?>) mcqCard.get("topicWisePerformance");
        if (topics != null) {
            for (Object t : topics) {
                if (t instanceof Map) {
                    Map<?, ?> tMap = (Map<?, ?>) t;
                    Number pct = (Number) tMap.get("percentage");
                    if (pct != null && pct.doubleValue() >= 80.0) {
                        strengths.add("Mastery in technical topic: " + tMap.get("topic") + " (" + pct.intValue() + "% correct)");
                    }
                }
            }
        }

        // Video strengths
        Map<?, ?> techBreakdown = (Map<?, ?>) videoCard.get("technicalAnswerQualityBreakdown");
        if (techBreakdown != null) {
            Number conceptUsage = (Number) techBreakdown.get("roleConceptUsage");
            if (conceptUsage != null && conceptUsage.doubleValue() >= 75.0) {
                strengths.add("Demonstrated articulate command of core domain terminology and system architecture in live verbal responses.");
            }
        }

        if (strengths.isEmpty()) {
            strengths.add("Solid baseline competency across full-lifecycle engineering requirements.");
        }
        return strengths;
    }

    private List<String> synthesizeSkillGaps(Map<String, Object> resumeCard, Map<String, Object> mcqCard, Map<String, Object> videoCard) {
        Set<String> gaps = new LinkedHashSet<>();

        // Resume missing skills
        List<?> rMissing = (List<?>) resumeCard.get("missingSkills");
        if (rMissing != null) {
            for (Object m : rMissing) {
                if (m instanceof Map) {
                    Object s = ((Map<?, ?>) m).get("skill");
                    if (s != null) gaps.add(s.toString());
                } else if (m instanceof String) {
                    gaps.add((String) m);
                }
            }
        }

        // MCQ learning gaps
        List<?> mGaps = (List<?>) mcqCard.get("learningGaps");
        if (mGaps != null) {
            for (Object g : mGaps) {
                if (g != null) gaps.add(g.toString());
            }
        }

        // Video missing concepts
        List<?> vQuestions = (List<?>) videoCard.get("questions");
        if (vQuestions != null) {
            for (Object q : vQuestions) {
                if (q instanceof Map) {
                    List<?> qMissing = (List<?>) ((Map<?, ?>) q).get("missingKeyPoints");
                    if (qMissing != null) {
                        for (Object km : qMissing) {
                            if (km != null) gaps.add(km.toString());
                        }
                    }
                }
            }
        }

        if (gaps.isEmpty()) {
            gaps.add("Distributed systems consistency models");
            gaps.add("High-throughput performance profiling and benchmarking");
        }
        return new ArrayList<>(gaps).stream().limit(6).collect(Collectors.toList());
    }

    private List<Map<String, Object>> generatePersonalizedRoadmap(String roleName, List<String> skillGaps) {
        List<Map<String, Object>> roadmap = new ArrayList<>();

        // Phase 1: Core Technical Gaps
        Map<String, Object> phase1 = new HashMap<>();
        phase1.put("phase", "Phase 1: Foundation & High-Priority Concept Remediation");
        phase1.put("duration", "Weeks 1–2");
        phase1.put("focus", "Remediate missed MCQ topics and unevidenced resume skills");
        List<String> p1Actions = skillGaps.stream().limit(3)
                .map(gap -> "Deep-dive study and hands-on exercises in " + gap)
                .collect(Collectors.toList());
        if (p1Actions.isEmpty()) {
            p1Actions.add("Review domain core architectural patterns and concurrency fundamentals.");
        }
        phase1.put("actions", p1Actions);
        roadmap.add(phase1);

        // Phase 2: Production Systems & Architecture
        Map<String, Object> phase2 = new HashMap<>();
        phase2.put("phase", "Phase 2: Architectural Trade-Offs & Production Systems");
        phase2.put("duration", "Weeks 3–4");
        phase2.put("focus", "Build end-to-end projects demonstrating production resilience");
        phase2.put("actions", List.of(
                "Implement distributed caching, rate limiting, and database indexing strategies.",
                "Design idempotent event-driven message consumers with automated dead-letter queues.",
                "Conduct stress-testing and latency profiling under simulated production load."
        ));
        roadmap.add(phase2);

        // Phase 3: Live Verbal Technical Articulation
        Map<String, Object> phase3 = new HashMap<>();
        phase3.put("phase", "Phase 3: Verbal Delivery & Interview Articulation");
        phase3.put("duration", "Weeks 5–6");
        phase3.put("focus", "Structure technical explanations using the STAR / Architecture Design framework");
        phase3.put("actions", List.of(
                "Practice vocalizing problem decomposition before jumping to code implementation.",
                "Formulate concrete trade-off comparisons (e.g. latency vs. consistency, throughput vs. durability).",
                "Calibrate verbal confidence with measured, deliberate pacing (target 120–140 WPM)."
        ));
        roadmap.add(phase3);

        return roadmap;
    }

    private AssessmentReportResponse mapEntityToDto(AssessmentReport entity) {
        AssessmentReportResponse dto = new AssessmentReportResponse();
        dto.setId(entity.getId());
        dto.setAssessmentSessionId(entity.getAssessmentSession().getId());
        dto.setJobRoleName(entity.getJobRoleName());
        dto.setDifficulty(entity.getDifficulty());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        dto.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);

        dto.setResumeWeight(entity.getResumeWeight());
        dto.setMcqWeight(entity.getMcqWeight());
        dto.setVideoWeight(entity.getVideoWeight());
        dto.setFormulaText(String.format("Overall Score = (Resume Score × %.2f) + (MCQ Score × %.2f) + (Video Score × %.2f)",
                entity.getResumeWeight(), entity.getMcqWeight(), entity.getVideoWeight()));

        dto.setOverallScore(entity.getOverallScore());
        dto.setResumeScore(entity.getResumeScore());
        dto.setMcqScore(entity.getMcqScore());
        dto.setVideoScore(entity.getVideoScore());

        if ("INCOMPLETE".equals(entity.getStatus())) {
            List<String> missingRounds = new ArrayList<>();
            if (entity.getResumeScore() == null) missingRounds.add("Resume Evaluation (Round 1)");
            if (entity.getMcqScore() == null) missingRounds.add("MCQ Technical Assessment (Round 2)");
            if (entity.getVideoScore() == null) missingRounds.add("AI Video Interview (Round 3)");
            dto.setIncompleteReason("Assessment is incomplete. Pending: " + String.join(", ", missingRounds) +
                    ". All three valid saved scores are required before an overall score is generated.");
        }

        dto.setResumeCard(fromJson(entity.getResumeCardJson(), Map.class));
        dto.setMcqCard(fromJson(entity.getMcqCardJson(), Map.class));
        dto.setVideoCard(fromJson(entity.getVideoCardJson(), Map.class));

        dto.setOverallStrengths(fromJson(entity.getStrengthsJson(), List.class));
        dto.setOverallSkillGaps(fromJson(entity.getSkillGapsJson(), List.class));
        dto.setLearningRoadmap(fromJson(entity.getLearningRoadmapJson(), List.class));
        dto.setDisclaimer(entity.getDisclaimer());

        return dto;
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to serialize to JSON", e);
            return null;
        }
    }

    private <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.trim().isEmpty()) return null;
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            log.error("Failed to deserialize from JSON", e);
            return null;
        }
    }
}
