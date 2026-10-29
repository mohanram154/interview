package com.interview.platform;

import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.CreateAssessmentSessionRequest;
import com.interview.platform.dto.interview.CreateInterviewRequest;
import com.interview.platform.dto.interview.InterviewResponse;
import com.interview.platform.entity.*;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.*;
import com.interview.platform.service.AssessmentSessionService;
import com.interview.platform.service.InterviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentSessionServiceTest {

    @Mock private AssessmentSessionRepository assessmentSessionRepository;
    @Mock private UserRepository userRepository;
    @Mock private JobRoleRepository jobRoleRepository;
    @Mock private InterviewRepository interviewRepository;
    @Mock private InterviewReportRepository interviewReportRepository;
    @Mock private InterviewService interviewService;
    @Mock private ResumeEvaluationRepository resumeEvaluationRepository;

    private AssessmentSessionService assessmentSessionService;

    @BeforeEach
    void setUp() {
        assessmentSessionService = new AssessmentSessionService(
                assessmentSessionRepository,
                userRepository,
                jobRoleRepository,
                interviewRepository,
                interviewReportRepository,
                interviewService,
                resumeEvaluationRepository
        );
    }

    @Test
    void testCreateSessionInitializesAtResumeStageAndLocksSubsequentStages() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(jobRoleRepository.findById(1L)).thenReturn(Optional.of(role));

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setDifficulty("INTERMEDIATE");
        session.setCurrentStage("RESUME_EVALUATION");
        session.setSessionStatus("IN_PROGRESS");
        session.setResumeStageStatus("NOT_STARTED");
        session.setMcqStageStatus("LOCKED");
        session.setVideoStageStatus("LOCKED");

        when(assessmentSessionRepository.save(any(AssessmentSession.class))).thenReturn(session);

        CreateAssessmentSessionRequest req = new CreateAssessmentSessionRequest(1L, "INTERMEDIATE");
        AssessmentSessionResponse resp = assessmentSessionService.createSession(10L, req);

        assertNotNull(resp);
        assertEquals(100L, resp.getId());
        assertEquals("RESUME_EVALUATION", resp.getCurrentStage());
        assertEquals("AVAILABLE", resp.getResumeStageStatus());
        assertEquals("LOCKED", resp.getMcqStageStatus());
        assertEquals("LOCKED", resp.getVideoStageStatus());

        // Lock flag assertions
        assertTrue(resp.isResumeUnlocked(), "Resume round must be unlocked when assessment starts");
        assertFalse(resp.isMcqUnlocked(), "MCQ round must remain locked initially");
        assertFalse(resp.isVideoUnlocked(), "Video round must remain locked initially");
        assertFalse(resp.isFinalReportUnlocked(), "Final report must remain locked initially");
    }

    @Test
    void testValidateStageAccessBlocksMcqBeforeResumeIsCompleted() {
        AssessmentSession session = new AssessmentSession();
        session.setResumeStageStatus("NOT_STARTED");
        session.setResumeScore(null);
        session.setMcqStageStatus("LOCKED");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                assessmentSessionService.validateStageAccess(session, "MCQ_ASSESSMENT")
        );
        assertTrue(ex.getMessage().contains("Complete Resume Evaluation to unlock this round."));
    }

    @Test
    void testCompleteResumeStageUnlocksMcq() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setCurrentStage("RESUME_EVALUATION");
        session.setResumeStageStatus("NOT_STARTED");
        session.setMcqStageStatus("LOCKED");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(assessmentSessionRepository.save(any(AssessmentSession.class))).thenAnswer(i -> i.getArgument(0));

        AssessmentSessionResponse resp = assessmentSessionService.completeResumeStage(
                100L, 10L, 88.0, 90.0, 85.0, "Great resume match", "resume.pdf"
        );

        assertNotNull(resp);
        assertEquals("COMPLETED", resp.getResumeStageStatus());
        assertEquals(88.0, resp.getResumeScore());
        assertEquals("MCQ_ASSESSMENT", resp.getCurrentStage());
        assertTrue(resp.isMcqUnlocked(), "MCQ round must be unlocked after resume round is completed");
        assertFalse(resp.isVideoUnlocked(), "Video round must remain locked until MCQ is completed");
    }

    @Test
    void testValidateStageAccessBlocksVideoBeforeMcqIsCompleted() {
        AssessmentSession session = new AssessmentSession();
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(85.0);
        session.setMcqStageStatus("NOT_STARTED");
        session.setMcqScore(null);
        session.setVideoStageStatus("LOCKED");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                assessmentSessionService.validateStageAccess(session, "VIDEO_INTERVIEW")
        );
        assertTrue(ex.getMessage().contains("Complete MCQ Assessment to unlock this round."));
    }

    @Test
    void testCompleteMcqStageUnlocksVideo() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setCurrentStage("MCQ_ASSESSMENT");
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(85.0);
        session.setMcqStageStatus("NOT_STARTED");
        session.setVideoStageStatus("LOCKED");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.of(new ResumeEvaluation()));
        when(assessmentSessionRepository.save(any(AssessmentSession.class))).thenAnswer(i -> i.getArgument(0));

        AssessmentSessionResponse resp = assessmentSessionService.completeMcqStage(100L, 10L, null, 90.0);

        assertNotNull(resp);
        assertEquals("COMPLETED", resp.getMcqStageStatus());
        assertEquals(90.0, resp.getMcqScore());
        assertEquals("VIDEO_INTERVIEW", resp.getCurrentStage());
        assertTrue(resp.isVideoUnlocked(), "Video interview must be unlocked after MCQ is completed");
        assertFalse(resp.isFinalReportUnlocked(), "Final report must remain locked until video interview is completed");
    }

    @Test
    void testCompleteVideoStageCalculatesCompositeScoreAndCompletesSession() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setCurrentStage("VIDEO_INTERVIEW");
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(80.0);
        session.setMcqStageStatus("COMPLETED");
        session.setMcqScore(90.0);
        session.setVideoStageStatus("NOT_STARTED");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(assessmentSessionRepository.save(any(AssessmentSession.class))).thenAnswer(i -> i.getArgument(0));

        // Video score: 85.0
        // Expected Composite = (80.0 * 0.25) + (90.0 * 0.40) + (85.0 * 0.35)
        // = 20.0 + 36.0 + 29.75 = 85.75 -> rounded to 85.8
        AssessmentSessionResponse resp = assessmentSessionService.completeVideoStage(
                100L, 10L, 85.0, 85.0, 85.0, "CONFIDENT", "Superb video interview"
        );

        assertNotNull(resp);
        assertEquals("COMPLETED", resp.getVideoStageStatus());
        assertEquals("COMPLETED", resp.getCurrentStage());
        assertEquals("COMPLETED", resp.getSessionStatus());
        assertEquals(85.8, resp.getFinalCompositeScore());
        assertTrue(resp.isFinalReportUnlocked(), "Final report must be unlocked after all three rounds finish");
    }

    @Test
    void testUnauthorizedUserCannotAccessSession() {
        User owner = new User("Owner", "owner@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        owner.setId(10L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(owner);

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        assertThrows(UnauthorizedAccessException.class, () ->
                assessmentSessionService.getSessionById(100L, 99L)
        );
    }

    @Test
    void testStartOrResumeMcqRoundWith15Questions() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setDifficulty("INTERMEDIATE");
        session.setQuestionCount(15);
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(85.0);
        session.setMcqStageStatus("AVAILABLE");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.of(new ResumeEvaluation()));

        Interview mockInterview = new Interview();
        mockInterview.setId(555L);
        when(interviewRepository.findById(555L)).thenReturn(Optional.of(mockInterview));

        InterviewResponse mockResp = new InterviewResponse();
        mockResp.setId(555L);
        mockResp.setTotalQuestions(15);
        when(interviewService.createInterview(eq(10L), any(CreateInterviewRequest.class))).thenReturn(mockResp);

        InterviewResponse resp = assessmentSessionService.startOrResumeMcqRound(100L, 10L, 15);

        assertNotNull(resp);
        assertEquals(555L, resp.getId());
        assertEquals(15, resp.getTotalQuestions());

        ArgumentCaptor<CreateInterviewRequest> captor = ArgumentCaptor.forClass(CreateInterviewRequest.class);
        verify(interviewService).createInterview(eq(10L), captor.capture());
        assertEquals(15, captor.getValue().getQuestionCount());
        assertEquals("MCQ", captor.getValue().getMode());
    }

    @Test
    void testStartOrResumeMcqRoundDefaultsTo20Questions() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setDifficulty("INTERMEDIATE");
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(85.0);
        session.setMcqStageStatus("AVAILABLE");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.of(new ResumeEvaluation()));

        Interview mockInterview = new Interview();
        mockInterview.setId(777L);
        when(interviewRepository.findById(777L)).thenReturn(Optional.of(mockInterview));

        InterviewResponse mockResp = new InterviewResponse();
        mockResp.setId(777L);
        mockResp.setTotalQuestions(20);
        when(interviewService.createInterview(eq(10L), any(CreateInterviewRequest.class))).thenReturn(mockResp);

        InterviewResponse resp = assessmentSessionService.startOrResumeMcqRound(100L, 10L);

        assertNotNull(resp);
        assertEquals(777L, resp.getId());

        ArgumentCaptor<CreateInterviewRequest> captor = ArgumentCaptor.forClass(CreateInterviewRequest.class);
        verify(interviewService).createInterview(eq(10L), captor.capture());
        assertEquals(20, captor.getValue().getQuestionCount());
    }

    @Test
    void testStartMcqRoundRejectedWhenResumeNotCompleted() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setResumeStageStatus("IN_PROGRESS");
        session.setResumeScore(null);
        session.setMcqStageStatus("LOCKED");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                assessmentSessionService.startOrResumeMcqRound(100L, 10L)
        );
        assertTrue(ex.getMessage().contains("Complete Resume Evaluation to unlock this round."));
        verifyNoInteractions(interviewService);
    }

    @Test
    void testCompleteMcqStageIsIdempotentAndPreventsDuplicateSubmissions() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(85.0);
        session.setMcqStageStatus("COMPLETED");
        session.setMcqScore(95.0);

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.of(new ResumeEvaluation()));

        AssessmentSessionResponse resp = assessmentSessionService.completeMcqStage(100L, 10L, 555L, 50.0);

        assertNotNull(resp);
        assertEquals(95.0, resp.getMcqScore(), "Duplicate submission should not overwrite already recorded score");
        verify(assessmentSessionRepository, never()).save(any(AssessmentSession.class));
    }
}

