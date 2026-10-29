package com.interview.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.VideoConsentRequest;
import com.interview.platform.dto.assessment.VideoInterviewStatusResponse;
import com.interview.platform.dto.assessment.VideoQuestionDto;
import com.interview.platform.entity.AssessmentSession;
import com.interview.platform.entity.JobRole;
import com.interview.platform.entity.ResumeEvaluation;
import com.interview.platform.entity.User;
import com.interview.platform.entity.VideoInterviewQuestion;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.AssessmentSessionRepository;
import com.interview.platform.repository.ResumeEvaluationRepository;
import com.interview.platform.repository.VideoInterviewQuestionRepository;
import com.interview.platform.service.AssessmentSessionService;
import com.interview.platform.service.VideoInterviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VideoInterviewServiceTest {

    @Mock
    private AssessmentSessionRepository assessmentSessionRepository;

    @Mock
    private AssessmentSessionService assessmentSessionService;

    @Mock
    private VideoInterviewQuestionRepository videoInterviewQuestionRepository;

    @Mock
    private ResumeEvaluationRepository resumeEvaluationRepository;

    @TempDir
    Path tempDir;

    private VideoInterviewService videoInterviewService;
    private ObjectMapper objectMapper;

    private User candidateUser;
    private JobRole javaRole;
    private AssessmentSession activeSession;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        videoInterviewService = new VideoInterviewService(
                assessmentSessionRepository,
                assessmentSessionService,
                videoInterviewQuestionRepository,
                resumeEvaluationRepository,
                objectMapper,
                tempDir.toString()
        );

        candidateUser = new User();
        candidateUser.setId(10L);
        candidateUser.setName("Jane Candidate");
        candidateUser.setEmail("jane@example.com");

        javaRole = new JobRole();
        javaRole.setId(3L);
        javaRole.setName("Java Developer");

        activeSession = new AssessmentSession();
        activeSession.setId(100L);
        activeSession.setUser(candidateUser);
        activeSession.setJobRole(javaRole);
        activeSession.setDifficulty("INTERMEDIATE");
        activeSession.setResumeStageStatus("COMPLETED");
        activeSession.setResumeScore(88.0);
        activeSession.setMcqStageStatus("COMPLETED");
        activeSession.setMcqScore(90.0);
        activeSession.setVideoStageStatus("AVAILABLE");
    }

    @Test
    void testRecordConsent_Success() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(Collections.emptyList());
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.empty());
        when(videoInterviewQuestionRepository.save(any(VideoInterviewQuestion.class))).thenAnswer(inv -> {
            VideoInterviewQuestion q = inv.getArgument(0);
            q.setId((long) (q.getSequenceNumber() * 10));
            return q;
        });

        VideoConsentRequest req = new VideoConsentRequest(true);
        VideoInterviewStatusResponse resp = videoInterviewService.recordConsent(100L, 10L, req);

        assertNotNull(resp);
        assertTrue(resp.isConsentGiven());
        assertNotNull(resp.getConsentGivenAt());
        assertEquals("Java Developer", resp.getJobRoleName());
        assertEquals(6, resp.getQuestions().size());
        verify(assessmentSessionService).validateStageAccess(activeSession, "VIDEO_INTERVIEW");
        verify(assessmentSessionRepository).save(activeSession);
    }

    @Test
    void testRecordConsent_FailsWhenConsentFalse() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoConsentRequest req = new VideoConsentRequest(false);
        assertThrows(BadRequestException.class, () -> videoInterviewService.recordConsent(100L, 10L, req));
    }

    @Test
    void testRecordConsent_UnauthorizedUser_ThrowsException() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoConsentRequest req = new VideoConsentRequest(true);
        assertThrows(UnauthorizedAccessException.class, () -> videoInterviewService.recordConsent(100L, 999L, req));
    }

    @Test
    void testGetOrGenerateQuestions_TailoredWithResume() throws Exception {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(Collections.emptyList());

        ResumeEvaluation resume = new ResumeEvaluation();
        resume.setMatchedSkills(objectMapper.writeValueAsString(List.of("Java", "Spring Boot", "PostgreSQL")));
        resume.setRelevantProjects(objectMapper.writeValueAsString(List.of(
                Map.of("title", "Distributed Payment Gateway", "description", "High throughput processing")
        )));
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.of(resume));

        when(videoInterviewQuestionRepository.save(any(VideoInterviewQuestion.class))).thenAnswer(inv -> {
            VideoInterviewQuestion q = inv.getArgument(0);
            q.setId((long) (q.getSequenceNumber() * 10));
            return q;
        });

        List<VideoQuestionDto> dtos = videoInterviewService.getOrGenerateQuestions(100L, 10L);

        assertEquals(6, dtos.size());
        // Verify project tailoring was used
        assertTrue(dtos.stream().anyMatch(q -> q.getQuestionText().contains("Distributed Payment Gateway")));
        // Verify skills tailoring was used
        assertTrue(dtos.stream().anyMatch(q -> q.getQuestionText().contains("Java, Spring Boot")));
    }

    @Test
    void testUploadQuestionRecording_Success() {
        activeSession.setVideoConsentGivenAt(LocalDateTime.now());
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoInterviewQuestion question = new VideoInterviewQuestion();
        question.setId(50L);
        question.setAssessmentSession(activeSession);
        question.setSequenceNumber(1);
        question.setQuestionText("Explain JVM memory model.");
        question.setCategory("Technical Knowledge");
        question.setStatus("PENDING");

        when(videoInterviewQuestionRepository.findByIdAndAssessmentSessionId(50L, 100L))
                .thenReturn(Optional.of(question));
        when(videoInterviewQuestionRepository.save(any(VideoInterviewQuestion.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "file", "answer.webm", "video/webm", "mock video content bytes".getBytes()
        );

        VideoQuestionDto result = videoInterviewService.uploadQuestionRecording(100L, 10L, 50L, file, 75);

        assertNotNull(result);
        assertEquals("UPLOADED", result.getStatus());
        assertTrue(result.isHasRecording());
        assertEquals(75, result.getRecordingDurationSeconds());
        assertEquals(file.getSize(), result.getRecordingFileSize());
        assertNotNull(result.getUploadedAt());
    }

    @Test
    void testUploadQuestionRecording_FailsWhenNoConsent() {
        activeSession.setVideoConsentGivenAt(null); // No consent
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        MockMultipartFile file = new MockMultipartFile(
                "file", "answer.webm", "video/webm", "bytes".getBytes()
        );

        assertThrows(BadRequestException.class, () ->
                videoInterviewService.uploadQuestionRecording(100L, 10L, 50L, file, 60));
    }

    @Test
    void testUploadQuestionRecording_FailsWhenFileExceedsLimit() {
        activeSession.setVideoConsentGivenAt(LocalDateTime.now());
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoInterviewQuestion question = new VideoInterviewQuestion();
        question.setId(50L);
        question.setAssessmentSession(activeSession);
        when(videoInterviewQuestionRepository.findByIdAndAssessmentSessionId(50L, 100L))
                .thenReturn(Optional.of(question));

        // Create mock file exceeding 50 MB
        byte[] bigContent = new byte[10];
        MockMultipartFile bigFile = new MockMultipartFile(
                "file", "big.webm", "video/webm", bigContent
        ) {
            @Override
            public long getSize() {
                return 55_000_000L; // 55 MB
            }
        };

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                videoInterviewService.uploadQuestionRecording(100L, 10L, 50L, bigFile, 120));
        assertTrue(ex.getMessage().contains("50 MB"));
    }

    @Test
    void testFinishVideoInterview_Success() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        when(videoInterviewQuestionRepository.countByAssessmentSessionIdAndStatus(100L, "UPLOADED")).thenReturn(5L);
        when(videoInterviewQuestionRepository.countByAssessmentSessionId(100L)).thenReturn(6L);

        AssessmentSessionResponse mockResp = new AssessmentSessionResponse();
        mockResp.setId(100L);
        mockResp.setCurrentStage("COMPLETED");
        when(assessmentSessionService.completeVideoStage(eq(100L), eq(10L), anyDouble(), anyDouble(), anyDouble(), anyString(), anyString()))
                .thenReturn(mockResp);

        AssessmentSessionResponse res = videoInterviewService.finishVideoInterview(100L, 10L);
        assertNotNull(res);
        assertEquals("COMPLETED", res.getCurrentStage());
        verify(assessmentSessionService).completeVideoStage(eq(100L), eq(10L), anyDouble(), anyDouble(), anyDouble(), anyString(), anyString());
    }

    @Test
    void testFinishVideoInterview_ThrowsWhenZeroUploaded() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        when(videoInterviewQuestionRepository.countByAssessmentSessionIdAndStatus(100L, "UPLOADED")).thenReturn(0L);

        assertThrows(BadRequestException.class, () -> videoInterviewService.finishVideoInterview(100L, 10L));
    }
}
