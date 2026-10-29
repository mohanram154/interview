package com.interview.platform.service;

import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.CreateAssessmentSessionRequest;
import com.interview.platform.dto.interview.CreateInterviewRequest;
import com.interview.platform.dto.interview.InterviewResponse;
import com.interview.platform.entity.AssessmentSession;
import com.interview.platform.entity.Interview;
import com.interview.platform.entity.InterviewReport;
import com.interview.platform.entity.JobRole;
import com.interview.platform.entity.User;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.AssessmentSessionRepository;
import com.interview.platform.repository.InterviewReportRepository;
import com.interview.platform.repository.InterviewRepository;
import com.interview.platform.repository.JobRoleRepository;
import com.interview.platform.repository.ResumeEvaluationRepository;
import com.interview.platform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssessmentSessionService {

    private final AssessmentSessionRepository assessmentSessionRepository;
    private final UserRepository userRepository;
    private final JobRoleRepository jobRoleRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewReportRepository interviewReportRepository;
    private final InterviewService interviewService;
    private final ResumeEvaluationRepository resumeEvaluationRepository;

    public AssessmentSessionService(
            AssessmentSessionRepository assessmentSessionRepository,
            UserRepository userRepository,
            JobRoleRepository jobRoleRepository,
            InterviewRepository interviewRepository,
            InterviewReportRepository interviewReportRepository,
            InterviewService interviewService,
            ResumeEvaluationRepository resumeEvaluationRepository
    ) {
        this.assessmentSessionRepository = assessmentSessionRepository;
        this.userRepository = userRepository;
        this.jobRoleRepository = jobRoleRepository;
        this.interviewRepository = interviewRepository;
        this.interviewReportRepository = interviewReportRepository;
        this.interviewService = interviewService;
        this.resumeEvaluationRepository = resumeEvaluationRepository;
    }

    @Transactional
    public AssessmentSessionResponse createSession(Long userId, CreateAssessmentSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        JobRole jobRole = jobRoleRepository.findById(request.getJobRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Job role not found with ID: " + request.getJobRoleId()));

        String difficulty = request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "INTERMEDIATE";
        int questionCount = (request.getQuestionCount() != null && request.getQuestionCount() == 15) ? 15 : 20;

        AssessmentSession session = new AssessmentSession();
        session.setUser(user);
        session.setJobRole(jobRole);
        session.setDifficulty(difficulty);
        session.setQuestionCount(questionCount);
        session.setCurrentStage("RESUME_EVALUATION");
        session.setSessionStatus("IN_PROGRESS");

        // Round 1 (Resume) is accessible initially
        session.setResumeStageStatus("AVAILABLE");

        // Rounds 2 & 3 are strictly locked initially
        session.setMcqStageStatus("LOCKED");
        session.setVideoStageStatus("LOCKED");

        AssessmentSession saved = assessmentSessionRepository.save(session);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public AssessmentSessionResponse getSessionById(Long sessionId, Long userId) {
        AssessmentSession session = assessmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to view this assessment session.");
        }

        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public AssessmentSessionResponse getActiveSession(Long userId) {
        return assessmentSessionRepository
                .findFirstByUserIdAndSessionStatusOrderByCreatedAtDesc(userId, "IN_PROGRESS")
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<AssessmentSessionResponse> getUserSessions(Long userId) {
        List<AssessmentSession> list = assessmentSessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Strictly verifies sequential round access gates.
     * Prevents skipping or jumping directly to locked rounds via URL or API.
     */
    public void validateStageAccess(AssessmentSession session, String targetStage) {
        String stage = targetStage != null ? targetStage.toUpperCase().trim() : "";

        switch (stage) {
            case "RESUME_EVALUATION":
                // Always accessible
                break;

            case "MCQ_ASSESSMENT":
                if (!"COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) 
                        || session.getResumeScore() == null
                        || resumeEvaluationRepository.findByAssessmentSessionId(session.getId()).isEmpty()) {
                    throw new BadRequestException("Complete Resume Evaluation to unlock this round.");
                }
                break;

            case "VIDEO_INTERVIEW":
                if (!"COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) || session.getResumeScore() == null) {
                    throw new BadRequestException("Complete Resume Evaluation to unlock this round.");
                }
                if (!"COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) || session.getMcqScore() == null) {
                    throw new BadRequestException("Complete MCQ Assessment to unlock this round.");
                }
                break;

            case "FINAL_REPORT":
            case "COMPLETED":
                if (!"COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) || session.getResumeScore() == null) {
                    throw new BadRequestException("Complete Resume Evaluation to unlock this round.");
                }
                if (!"COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) || session.getMcqScore() == null) {
                    throw new BadRequestException("Complete MCQ Assessment to unlock this round.");
                }
                if (!"COMPLETED".equalsIgnoreCase(session.getVideoStageStatus()) || session.getVideoScore() == null) {
                    throw new BadRequestException("Complete all three assessment rounds to unlock the final report.");
                }
                break;

            default:
                throw new BadRequestException("Unknown assessment stage: " + targetStage);
        }
    }

    /**
     * Start/Resume Round 1 (Resume Evaluation)
     */
    @Transactional
    public AssessmentSessionResponse startResumeRound(Long sessionId, Long userId) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        if (!"COMPLETED".equalsIgnoreCase(session.getResumeStageStatus())) {
            session.setResumeStageStatus("IN_PROGRESS");
            session.setCurrentStage("RESUME_EVALUATION");
            session = assessmentSessionRepository.save(session);
        }

        return mapToResponse(session);
    }

    /**
     * Progresses session after successful Resume round completion.
     * Unlocks Stage 2 (MCQ).
     */
    @Transactional
    public AssessmentSessionResponse completeResumeStage(
            Long sessionId,
            Long userId,
            Double score,
            Double skillsMatch,
            Double experienceScore,
            String feedback,
            String filename
    ) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        if (score == null || score < 0.0 || score > 100.0) {
            throw new BadRequestException("Resume score must be between 0 and 100.");
        }

        session.setResumeScore(Math.round(score * 10.0) / 10.0);
        session.setResumeSkillsMatchScore(skillsMatch != null ? Math.round(skillsMatch * 10.0) / 10.0 : null);
        session.setResumeExperienceScore(experienceScore != null ? Math.round(experienceScore * 10.0) / 10.0 : null);
        session.setResumeFeedback(feedback != null ? feedback : "Resume evaluation completed.");
        session.setResumeFilename(filename);
        session.setResumeStageStatus("COMPLETED");
        session.setResumeCompletedAt(LocalDateTime.now());

        // Unlock Stage 2: MCQ Round
        session.setCurrentStage("MCQ_ASSESSMENT");
        if ("LOCKED".equalsIgnoreCase(session.getMcqStageStatus()) || "NOT_STARTED".equalsIgnoreCase(session.getMcqStageStatus())) {
            session.setMcqStageStatus("AVAILABLE");
        }

        AssessmentSession updated = assessmentSessionRepository.save(session);
        return mapToResponse(updated);
    }

    /**
     * Start/Resume Round 2 (MCQ Assessment)
     * Strictly gated: Rejects if Resume round is not completed.
     */
    @Transactional
    public InterviewResponse startOrResumeMcqRound(Long sessionId, Long userId) {
        return startOrResumeMcqRound(sessionId, userId, null);
    }

    @Transactional
    public InterviewResponse startOrResumeMcqRound(Long sessionId, Long userId, Integer requestedQuestionCount) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        // Enforce prerequisite check
        validateStageAccess(session, "MCQ_ASSESSMENT");

        Interview mcqInterview = session.getMcqInterview();
        if (mcqInterview == null) {
            int count = (requestedQuestionCount != null && (requestedQuestionCount == 15 || requestedQuestionCount == 20))
                    ? requestedQuestionCount
                    : (session.getQuestionCount() != null && session.getQuestionCount() == 15 ? 15 : 20);
            session.setQuestionCount(count);

            // Initialize MCQ interview session
            CreateInterviewRequest req = new CreateInterviewRequest();
            req.setJobRoleId(session.getJobRole().getId());
            req.setDifficulty(session.getDifficulty());
            req.setMode("MCQ");
            req.setQuestionCount(count);

            InterviewResponse interviewResp = interviewService.createInterview(userId, req);
            mcqInterview = interviewRepository.findById(interviewResp.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Created MCQ Interview not found."));

            session.setMcqInterview(mcqInterview);
            session.setMcqStageStatus("IN_PROGRESS");
            session.setCurrentStage("MCQ_ASSESSMENT");
            assessmentSessionRepository.save(session);

            return interviewResp;
        } else {
            // Resume existing MCQ interview
            if (!"COMPLETED".equalsIgnoreCase(session.getMcqStageStatus())) {
                session.setMcqStageStatus("IN_PROGRESS");
                session.setCurrentStage("MCQ_ASSESSMENT");
                assessmentSessionRepository.save(session);
            }
            return interviewService.getInterviewById(mcqInterview.getId(), userId);
        }
    }

    /**
     * Progresses session after successful MCQ round completion.
     * Unlocks Stage 3 (Video Interview).
     */
    @Transactional
    public AssessmentSessionResponse completeMcqStage(
            Long sessionId,
            Long userId,
            Long mcqInterviewId,
            Double score
    ) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        // Validate prerequisite
        validateStageAccess(session, "MCQ_ASSESSMENT");

        // Prevent duplicate submissions from corrupting state
        if ("COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) && session.getMcqScore() != null) {
            return mapToResponse(session);
        }

        Interview interview = null;
        if (mcqInterviewId != null) {
            interview = interviewRepository.findById(mcqInterviewId)
                    .orElseThrow(() -> new ResourceNotFoundException("MCQ Interview not found with ID: " + mcqInterviewId));
            session.setMcqInterview(interview);
        } else if (session.getMcqInterview() != null) {
            interview = session.getMcqInterview();
        }

        Double finalMcqScore = score;
        if (finalMcqScore == null && interview != null) {
            finalMcqScore = interviewReportRepository.findByInterviewId(interview.getId())
                    .map(InterviewReport::getOverallScore)
                    .orElse(null);
        }

        if (finalMcqScore == null) {
            throw new BadRequestException("MCQ assessment score is required to complete this round.");
        }

        finalMcqScore = Math.round(finalMcqScore * 10.0) / 10.0;
        session.setMcqScore(finalMcqScore);
        session.setMcqStageStatus("COMPLETED");
        session.setMcqCompletedAt(LocalDateTime.now());

        // Unlock Stage 3: AI Video Interview
        session.setCurrentStage("VIDEO_INTERVIEW");
        if ("LOCKED".equalsIgnoreCase(session.getVideoStageStatus()) || "NOT_STARTED".equalsIgnoreCase(session.getVideoStageStatus())) {
            session.setVideoStageStatus("AVAILABLE");
        }

        AssessmentSession updated = assessmentSessionRepository.save(session);
        return mapToResponse(updated);
    }

    /**
     * Start/Resume Round 3 (AI Video Interview)
     * Strictly gated: Rejects if MCQ round is not completed.
     */
    @Transactional
    public AssessmentSessionResponse startOrResumeVideoRound(Long sessionId, Long userId) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        // Enforce prerequisite check
        validateStageAccess(session, "VIDEO_INTERVIEW");

        if (!"COMPLETED".equalsIgnoreCase(session.getVideoStageStatus())) {
            session.setVideoStageStatus("IN_PROGRESS");
            session.setCurrentStage("VIDEO_INTERVIEW");
            session = assessmentSessionRepository.save(session);
        }

        return mapToResponse(session);
    }

    /**
     * Progresses session after successful Video Interview round completion.
     * Calculates Final Combined Composite Score and generates Final Report.
     */
    @Transactional
    public AssessmentSessionResponse completeVideoStage(
            Long sessionId,
            Long userId,
            Double score,
            Double technicalScore,
            Double communicationScore,
            String sentimentLabel,
            String feedback
    ) {
        AssessmentSession session = getSessionEntity(sessionId, userId);

        // Validate prerequisite
        validateStageAccess(session, "VIDEO_INTERVIEW");

        double finalVideoScore = score != null ? Math.round(score * 10.0) / 10.0 : 0.0;
        session.setVideoScore(finalVideoScore);
        session.setVideoTechnicalScore(technicalScore != null ? Math.round(technicalScore * 10.0) / 10.0 : finalVideoScore);
        session.setVideoCommunicationScore(communicationScore != null ? Math.round(communicationScore * 10.0) / 10.0 : finalVideoScore);
        session.setVideoSentimentLabel(sentimentLabel != null ? sentimentLabel : "CONFIDENT");
        session.setVideoFeedback(feedback != null ? feedback : "Video technical interview completed.");
        session.setVideoStageStatus("COMPLETED");
        session.setVideoCompletedAt(LocalDateTime.now());

        // Composite scoring formula: 25% Resume + 40% MCQ + 35% AI Video
        double resume = session.getResumeScore() != null ? session.getResumeScore() : 0.0;
        double mcq = session.getMcqScore() != null ? session.getMcqScore() : 0.0;
        double video = finalVideoScore;

        double composite = (resume * 0.25) + (mcq * 0.40) + (video * 0.35);
        double roundedComposite = Math.round(composite * 10.0) / 10.0;

        session.setFinalCompositeScore(roundedComposite);
        session.setFinalSummary(String.format(
                "Full assessment completed for role '%s' at %s level. Final Composite Score: %.1f%% (Resume: %.1f%%, MCQ: %.1f%%, Video Interview: %.1f%%).",
                session.getJobRole().getName(),
                session.getDifficulty(),
                roundedComposite,
                resume,
                mcq,
                video
        ));

        session.setCurrentStage("COMPLETED");
        session.setSessionStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());

        AssessmentSession updated = assessmentSessionRepository.save(session);
        return mapToResponse(updated);
    }

    private AssessmentSession getSessionEntity(Long sessionId, Long userId) {
        AssessmentSession session = assessmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to access this assessment session.");
        }

        return session;
    }

    public AssessmentSessionResponse mapToResponse(AssessmentSession session) {
        AssessmentSessionResponse resp = new AssessmentSessionResponse();
        resp.setId(session.getId());
        resp.setUserId(session.getUser().getId());
        resp.setJobRoleId(session.getJobRole().getId());
        resp.setJobRoleName(session.getJobRole().getName());
        resp.setDifficulty(session.getDifficulty());
        resp.setQuestionCount(session.getQuestionCount());
        resp.setCurrentStage(session.getCurrentStage());
        resp.setSessionStatus(session.getSessionStatus());

        // Lock determination
        boolean isResumeCompleted = "COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) && session.getResumeScore() != null;
        boolean isMcqCompleted = isResumeCompleted && "COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) && session.getMcqScore() != null;
        boolean isVideoCompleted = isMcqCompleted && "COMPLETED".equalsIgnoreCase(session.getVideoStageStatus()) && session.getVideoScore() != null;

        // Progress Text & Active Round
        if (!isResumeCompleted) {
            resp.setProgressText("Round 1 of 3: Resume Evaluation");
            resp.setActiveRoundNumber(1);
        } else if (!isMcqCompleted) {
            resp.setProgressText("Round 2 of 3: MCQ Technical Assessment");
            resp.setActiveRoundNumber(2);
        } else if (!isVideoCompleted) {
            resp.setProgressText("Round 3 of 3: AI Video Interview");
            resp.setActiveRoundNumber(3);
        } else {
            resp.setProgressText("All 3 Rounds Completed");
            resp.setActiveRoundNumber(4);
        }

        // --- Round 1: Resume Evaluation ---
        String resumeStatus = normalizeStatus(session.getResumeStageStatus(), true);
        String resumeAction = isResumeCompleted ? "View Evaluation" : "IN_PROGRESS".equalsIgnoreCase(resumeStatus) ? "Continue Resume Evaluation" : "Start Resume Evaluation";
        AssessmentSessionResponse.RoundDetailDto resumeDto = new AssessmentSessionResponse.RoundDetailDto(
                "RESUME_EVALUATION",
                "Resume Evaluation",
                1,
                resumeStatus,
                true,
                null,
                session.getResumeScore(),
                session.getResumeFeedback(),
                session.getResumeCompletedAt(),
                resumeAction,
                "/assessment/" + session.getId() + "/resume"
        );
        resp.setResumeRound(resumeDto);

        // --- Round 2: MCQ Technical Assessment ---
        boolean isMcqUnlocked = isResumeCompleted;
        String mcqStatus = isMcqUnlocked ? normalizeStatus(session.getMcqStageStatus(), true) : "LOCKED";
        String mcqLockMsg = isMcqUnlocked ? null : "Complete Resume Evaluation to unlock this round.";
        String mcqAction = isMcqCompleted ? "View MCQ Results" : "IN_PROGRESS".equalsIgnoreCase(mcqStatus) ? "Continue MCQ Assessment" : "Start MCQ Assessment";
        AssessmentSessionResponse.RoundDetailDto mcqDto = new AssessmentSessionResponse.RoundDetailDto(
                "MCQ_ASSESSMENT",
                "MCQ Technical Assessment",
                2,
                mcqStatus,
                isMcqUnlocked,
                mcqLockMsg,
                session.getMcqScore(),
                null,
                session.getMcqCompletedAt(),
                mcqAction,
                "/assessment/" + session.getId() + "/mcq"
        );
        resp.setMcqRound(mcqDto);

        // --- Round 3: AI Video Interview ---
        boolean isVideoUnlocked = isMcqCompleted;
        String videoStatus = isVideoUnlocked ? normalizeStatus(session.getVideoStageStatus(), true) : "LOCKED";
        String videoLockMsg = isVideoUnlocked ? null : "Complete MCQ Assessment to unlock this round.";
        String videoAction = isVideoCompleted ? "View Video Analytics" : "IN_PROGRESS".equalsIgnoreCase(videoStatus) ? "Continue Video Interview" : "Start Video Interview";
        AssessmentSessionResponse.RoundDetailDto videoDto = new AssessmentSessionResponse.RoundDetailDto(
                "VIDEO_INTERVIEW",
                "AI Video Interview",
                3,
                videoStatus,
                isVideoUnlocked,
                videoLockMsg,
                session.getVideoScore(),
                session.getVideoFeedback(),
                session.getVideoCompletedAt(),
                videoAction,
                "/assessment/" + session.getId() + "/video"
        );
        resp.setVideoRound(videoDto);

        // --- Final Combined Report ---
        boolean isFinalReportUnlocked = isVideoCompleted;
        resp.setFinalReportUnlocked(isFinalReportUnlocked);
        resp.setFinalReportLockMessage(isFinalReportUnlocked ? null : "Complete all three assessment rounds to unlock the final report.");
        resp.setFinalCompositeScore(session.getFinalCompositeScore());
        resp.setFinalSummary(session.getFinalSummary());

        resp.setCreatedAt(session.getCreatedAt());
        resp.setUpdatedAt(session.getUpdatedAt());
        resp.setCompletedAt(session.getCompletedAt());

        return resp;
    }

    private String normalizeStatus(String rawStatus, boolean isUnlocked) {
        if (!isUnlocked || "LOCKED".equalsIgnoreCase(rawStatus)) {
            return "LOCKED";
        }
        if ("COMPLETED".equalsIgnoreCase(rawStatus)) {
            return "COMPLETED";
        }
        if ("IN_PROGRESS".equalsIgnoreCase(rawStatus)) {
            return "IN_PROGRESS";
        }
        if ("FAILED".equalsIgnoreCase(rawStatus)) {
            return "FAILED";
        }
        return "AVAILABLE";
    }
}
