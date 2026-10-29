package com.interview.platform.service;

import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.CreateAssessmentSessionRequest;
import com.interview.platform.entity.AssessmentSession;
import com.interview.platform.entity.Interview;
import com.interview.platform.entity.JobRole;
import com.interview.platform.entity.User;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.AssessmentSessionRepository;
import com.interview.platform.repository.InterviewRepository;
import com.interview.platform.repository.JobRoleRepository;
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

    public AssessmentSessionService(
            AssessmentSessionRepository assessmentSessionRepository,
            UserRepository userRepository,
            JobRoleRepository jobRoleRepository,
            InterviewRepository interviewRepository
    ) {
        this.assessmentSessionRepository = assessmentSessionRepository;
        this.userRepository = userRepository;
        this.jobRoleRepository = jobRoleRepository;
        this.interviewRepository = interviewRepository;
    }

    @Transactional
    public AssessmentSessionResponse createSession(Long userId, CreateAssessmentSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        JobRole jobRole = jobRoleRepository.findById(request.getJobRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Job role not found with ID: " + request.getJobRoleId()));

        String difficulty = request.getDifficulty() != null ? request.getDifficulty().toUpperCase() : "INTERMEDIATE";

        AssessmentSession session = new AssessmentSession();
        session.setUser(user);
        session.setJobRole(jobRole);
        session.setDifficulty(difficulty);
        session.setCurrentStage("RESUME_EVALUATION");
        session.setSessionStatus("IN_PROGRESS");

        // Stage 1 (Resume) is accessible first
        session.setResumeStageStatus("NOT_STARTED");

        // Stages 2 & 3 are strictly locked initially
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
     * Prevents skipping or jumping directly to locked rounds.
     */
    public void validateStageAccess(AssessmentSession session, String targetStage) {
        String stage = targetStage != null ? targetStage.toUpperCase().trim() : "";

        switch (stage) {
            case "RESUME_EVALUATION":
                // Always accessible
                break;

            case "MCQ_ASSESSMENT":
                if (!"COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) || session.getResumeScore() == null) {
                    throw new BadRequestException("MCQ Assessment is locked. You must complete and save the Resume Evaluation round first.");
                }
                break;

            case "VIDEO_INTERVIEW":
                if (!"COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) || session.getMcqScore() == null) {
                    throw new BadRequestException("AI Video Interview is locked. You must complete and save the MCQ Assessment round first.");
                }
                break;

            case "FINAL_REPORT":
            case "COMPLETED":
                boolean allCompleted = "COMPLETED".equalsIgnoreCase(session.getResumeStageStatus())
                        && "COMPLETED".equalsIgnoreCase(session.getMcqStageStatus())
                        && "COMPLETED".equalsIgnoreCase(session.getVideoStageStatus())
                        && session.getResumeScore() != null
                        && session.getMcqScore() != null
                        && session.getVideoScore() != null;

                if (!allCompleted) {
                    throw new BadRequestException("Final Combined Report is locked until all three assessment rounds (Resume, MCQ, and Video) are completed.");
                }
                break;

            default:
                throw new BadRequestException("Unknown assessment stage: " + targetStage);
        }
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
        AssessmentSession session = assessmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Unauthorized access to assessment session.");
        }

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
        if ("LOCKED".equalsIgnoreCase(session.getMcqStageStatus())) {
            session.setMcqStageStatus("NOT_STARTED");
        }

        AssessmentSession updated = assessmentSessionRepository.save(session);
        return mapToResponse(updated);
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
        AssessmentSession session = assessmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Unauthorized access to assessment session.");
        }

        // Validate prerequisite
        validateStageAccess(session, "MCQ_ASSESSMENT");

        if (mcqInterviewId != null) {
            Interview interview = interviewRepository.findById(mcqInterviewId)
                    .orElseThrow(() -> new ResourceNotFoundException("MCQ Interview not found with ID: " + mcqInterviewId));
            session.setMcqInterview(interview);
        }

        double finalMcqScore = score != null ? Math.round(score * 10.0) / 10.0 : 0.0;
        session.setMcqScore(finalMcqScore);
        session.setMcqStageStatus("COMPLETED");
        session.setMcqCompletedAt(LocalDateTime.now());

        // Unlock Stage 3: AI Video Interview
        session.setCurrentStage("VIDEO_INTERVIEW");
        if ("LOCKED".equalsIgnoreCase(session.getVideoStageStatus())) {
            session.setVideoStageStatus("NOT_STARTED");
        }

        AssessmentSession updated = assessmentSessionRepository.save(session);
        return mapToResponse(updated);
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
        AssessmentSession session = assessmentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment session not found with ID: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("Unauthorized access to assessment session.");
        }

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

        // Calculate Final Combined Composite Score:
        // Weighting: 25% Resume Evaluation + 40% MCQ Knowledge Round + 35% AI Video Technical Interview
        double resume = session.getResumeScore() != null ? session.getResumeScore() : 0.0;
        double mcq = session.getMcqScore() != null ? session.getMcqScore() : 0.0;
        double video = finalVideoScore;

        double composite = (resume * 0.25) + (mcq * 0.40) + (video * 0.35);
        double roundedComposite = Math.round(composite * 10.0) / 10.0;

        session.setFinalCompositeScore(roundedComposite);
        session.setFinalSummary(String.format(
                "Assessment successfully completed for role '%s' at %s level. Final Composite Score: %.1f%% (Resume: %.1f%%, MCQ Assessment: %.1f%%, AI Video Interview: %.1f%%).",
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

    public AssessmentSessionResponse mapToResponse(AssessmentSession session) {
        AssessmentSessionResponse resp = new AssessmentSessionResponse();
        resp.setId(session.getId());
        resp.setUserId(session.getUser().getId());
        resp.setJobRoleId(session.getJobRole().getId());
        resp.setJobRoleName(session.getJobRole().getName());
        resp.setDifficulty(session.getDifficulty());
        resp.setCurrentStage(session.getCurrentStage());
        resp.setSessionStatus(session.getSessionStatus());

        // Stage 1
        resp.setResumeStageStatus(session.getResumeStageStatus());
        resp.setResumeScore(session.getResumeScore());
        resp.setResumeFilename(session.getResumeFilename());
        resp.setResumeSkillsMatchScore(session.getResumeSkillsMatchScore());
        resp.setResumeExperienceScore(session.getResumeExperienceScore());
        resp.setResumeFeedback(session.getResumeFeedback());
        resp.setResumeCompletedAt(session.getResumeCompletedAt());
        resp.setResumeUnlocked(true); // Stage 1 is always unlocked

        // Stage 2
        resp.setMcqStageStatus(session.getMcqStageStatus());
        if (session.getMcqInterview() != null) {
            resp.setMcqInterviewId(session.getMcqInterview().getId());
        }
        resp.setMcqScore(session.getMcqScore());
        resp.setMcqCompletedAt(session.getMcqCompletedAt());
        boolean isMcqUnlocked = "COMPLETED".equalsIgnoreCase(session.getResumeStageStatus()) && session.getResumeScore() != null;
        resp.setMcqUnlocked(isMcqUnlocked);

        // Stage 3
        resp.setVideoStageStatus(session.getVideoStageStatus());
        resp.setVideoScore(session.getVideoScore());
        resp.setVideoTechnicalScore(session.getVideoTechnicalScore());
        resp.setVideoCommunicationScore(session.getVideoCommunicationScore());
        resp.setVideoSentimentLabel(session.getVideoSentimentLabel());
        resp.setVideoFeedback(session.getVideoFeedback());
        resp.setVideoCompletedAt(session.getVideoCompletedAt());
        boolean isVideoUnlocked = isMcqUnlocked && "COMPLETED".equalsIgnoreCase(session.getMcqStageStatus()) && session.getMcqScore() != null;
        resp.setVideoUnlocked(isVideoUnlocked);

        // Final Report
        resp.setFinalCompositeScore(session.getFinalCompositeScore());
        resp.setFinalSummary(session.getFinalSummary());
        boolean isFinalReportUnlocked = isVideoUnlocked && "COMPLETED".equalsIgnoreCase(session.getVideoStageStatus()) && session.getVideoScore() != null;
        resp.setFinalReportUnlocked(isFinalReportUnlocked);

        resp.setCreatedAt(session.getCreatedAt());
        resp.setUpdatedAt(session.getUpdatedAt());
        resp.setCompletedAt(session.getCompletedAt());

        return resp;
    }
}
