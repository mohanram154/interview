package com.interview.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.platform.client.AiServiceClient;
import com.interview.platform.dto.assessment.AssessmentSessionResponse;
import com.interview.platform.dto.assessment.VideoConsentRequest;
import com.interview.platform.dto.assessment.VideoInterviewStatusResponse;
import com.interview.platform.dto.assessment.VideoQuestionDto;
import com.interview.platform.entity.*;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoInterviewServiceTest {

    @Mock
    private AssessmentSessionRepository assessmentSessionRepository;

    @Mock
    private AssessmentSessionService assessmentSessionService;

    @Mock
    private VideoInterviewQuestionRepository videoInterviewQuestionRepository;

    @Mock
    private ResumeEvaluationRepository resumeEvaluationRepository;

    @Mock
    private AiServiceClient aiServiceClient;

    private VideoInterviewService videoInterviewService;
    private ObjectMapper objectMapper;

    @TempDir
    Path tempUploadDir;

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
                aiServiceClient,
                objectMapper,
                tempUploadDir.toString()
        );

        candidateUser = new User();
        candidateUser.setId(10L);
        candidateUser.setEmail("candidate@test.com");

        javaRole = new JobRole();
        javaRole.setId(1L);
        javaRole.setName("Java Developer");

        activeSession = new AssessmentSession();
        activeSession.setId(100L);
        activeSession.setUser(candidateUser);
        activeSession.setJobRole(javaRole);
        activeSession.setDifficulty("INTERMEDIATE");
        activeSession.setResumeStageStatus("COMPLETED");
        activeSession.setResumeScore(85.0);
        activeSession.setMcqStageStatus("COMPLETED");
        activeSession.setMcqScore(90.0);
        activeSession.setVideoStageStatus("IN_PROGRESS");
        activeSession.setCurrentStage("VIDEO_INTERVIEW");
        activeSession.setVideoConsentGivenAt(LocalDateTime.now());
    }

    @Test
    void testRecordConsent_Success() {
        activeSession.setVideoConsentGivenAt(null);
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        when(assessmentSessionRepository.save(any(AssessmentSession.class))).thenAnswer(inv -> inv.getArgument(0));
        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(Collections.emptyList());
        when(videoInterviewQuestionRepository.save(any(VideoInterviewQuestion.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        VideoConsentRequest req = new VideoConsentRequest(true);

        VideoInterviewStatusResponse res = videoInterviewService.recordConsent(100L, 10L, req);
        assertNotNull(res);
        assertNotNull(activeSession.getVideoConsentGivenAt());
        verify(assessmentSessionRepository).save(activeSession);
    }

    @Test
    void testRecordConsent_ThrowsWhenNotAccepted() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        VideoConsentRequest req = new VideoConsentRequest(false);

        assertThrows(BadRequestException.class, () ->
                videoInterviewService.recordConsent(100L, 10L, req));
    }

    @Test
    void testGetOrGenerateQuestions_GeneratesWhenNoneExist() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(Collections.emptyList())
                .thenReturn(Collections.emptyList());
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.empty());

        List<VideoInterviewQuestion> savedList = new ArrayList<>();
        when(videoInterviewQuestionRepository.save(any(VideoInterviewQuestion.class)))
                .thenAnswer(inv -> {
                    VideoInterviewQuestion q = inv.getArgument(0);
                    q.setId((long) (savedList.size() + 1));
                    savedList.add(q);
                    return q;
                });

        List<VideoQuestionDto> questions = videoInterviewService.getOrGenerateQuestions(100L, 10L);
        assertNotNull(questions);
        assertTrue(questions.size() >= 5);
        assertEquals(1, questions.get(0).getSequenceNumber());
        assertEquals("PENDING", questions.get(0).getStatus());
    }

    @Test
    void testGetOrGenerateQuestions_ReturnsExisting() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoInterviewQuestion existingQ = new VideoInterviewQuestion();
        existingQ.setId(1L);
        existingQ.setAssessmentSession(activeSession);
        existingQ.setSequenceNumber(1);
        existingQ.setQuestionText("Explain JVM Memory Model");
        existingQ.setCategory("TECHNICAL_KNOWLEDGE");
        existingQ.setStatus("PENDING");

        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(List.of(existingQ));

        List<VideoQuestionDto> questions = videoInterviewService.getOrGenerateQuestions(100L, 10L);
        assertEquals(1, questions.size());
        assertEquals("Explain JVM Memory Model", questions.get(0).getQuestionText());
        verify(videoInterviewQuestionRepository, never()).save(any());
    }

    @Test
    void testGetStatus_Success() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoInterviewQuestion q1 = new VideoInterviewQuestion();
        q1.setId(1L);
        q1.setAssessmentSession(activeSession);
        q1.setSequenceNumber(1);
        q1.setQuestionText("Q1");
        q1.setCategory("TECHNICAL");
        q1.setStatus("UPLOADED");
        q1.setRecordingFilePath("/path/to/q1.webm");

        VideoInterviewQuestion q2 = new VideoInterviewQuestion();
        q2.setId(2L);
        q2.setAssessmentSession(activeSession);
        q2.setSequenceNumber(2);
        q2.setQuestionText("Q2");
        q2.setCategory("TECHNICAL");
        q2.setStatus("PENDING");

        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(List.of(q1, q2));

        VideoInterviewStatusResponse status = videoInterviewService.getStatus(100L, 10L);
        assertNotNull(status);
        assertEquals(100L, status.getSessionId());
        assertEquals("Java Developer", status.getJobRoleName());
        assertEquals(2, status.getTotalQuestions());
        assertEquals(1, status.getUploadedQuestions());
        assertFalse(status.isAllQuestionsUploaded());
    }

    @Test
    void testUploadQuestionRecording_Success() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoInterviewQuestion question = new VideoInterviewQuestion();
        question.setId(50L);
        question.setAssessmentSession(activeSession);
        question.setSequenceNumber(1);
        question.setQuestionText("Explain JVM memory model.");
        question.setCategory("TECHNICAL_KNOWLEDGE");
        question.setStatus("PENDING");

        when(videoInterviewQuestionRepository.findByIdAndAssessmentSessionId(50L, 100L))
                .thenReturn(Optional.of(question));
        when(videoInterviewQuestionRepository.save(any(VideoInterviewQuestion.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "file", "answer.webm", "video/webm", "mock video content bytes".getBytes()
        );

        Map<String, Object> aiMap = new HashMap<>();
        aiMap.put("fillerWordsCount", 1);
        aiMap.put("fillerWordRate", 0.8);
        aiMap.put("speechClarityLevel", "HIGH");
        aiMap.put("sentimentLabel", "CONFIDENT");
        aiMap.put("technicalScore", 88.0);
        aiMap.put("relevanceScore", 90.0);
        aiMap.put("conceptUsageScore", 85.0);
        aiMap.put("fluencyScore", 92.0);
        aiMap.put("completenessScore", 80.0);
        aiMap.put("confidenceCalibrationLabel", "CALIBRATED");
        aiMap.put("questionScore", 87.8);
        aiMap.put("speechSentiment", Map.of("fillerWordsCount", 1, "clarityLevel", "HIGH", "sentimentLabel", "CONFIDENT"));

        when(aiServiceClient.analyzeVideoRecording(any(), any(), any(), any(), any(), any())).thenReturn(aiMap);

        VideoQuestionDto result = videoInterviewService.uploadQuestionRecording(100L, 10L, 50L, file, 75, "My architectural solution is scalable");

        assertNotNull(result);
        assertEquals("UPLOADED", result.getStatus());
        assertTrue(result.isHasRecording());
        assertEquals(75, result.getRecordingDurationSeconds());
        assertEquals(file.getSize(), result.getRecordingFileSize());
        assertEquals(1, result.getFillerWordsCount());
        assertEquals("HIGH", result.getSpeechClarityLevel());
        assertEquals("CONFIDENT", result.getSentimentLabel());
        assertEquals("CALIBRATED", result.getConfidenceCalibrationLabel());
        assertEquals(88.0, result.getTechnicalScore());
        assertEquals("My architectural solution is scalable", result.getTranscript());
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

        MockMultipartFile bigFile = new MockMultipartFile(
                "file", "big.webm", "video/webm", new byte[10]
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

        VideoInterviewQuestion q1 = new VideoInterviewQuestion();
        q1.setId(1L);
        q1.setAssessmentSession(activeSession);
        q1.setStatus("UPLOADED");
        q1.setTechnicalScore(85.0);
        q1.setRelevanceScore(80.0);
        q1.setConceptUsageScore(75.0);
        q1.setFluencyScore(90.0);
        q1.setCompletenessScore(70.0);
        q1.setSentimentLabel("CONFIDENT");
        q1.setConfidenceCalibrationLabel("CALIBRATED");

        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(List.of(q1));

        AssessmentSessionResponse mockResp = new AssessmentSessionResponse();
        mockResp.setId(100L);
        mockResp.setCurrentStage("COMPLETED");

        when(assessmentSessionService.completeVideoStage(
                eq(100L), eq(10L), anyDouble(), anyDouble(), anyDouble(), anyString(), anyString(),
                anyDouble(), anyDouble(), anyDouble(), anyString()
        )).thenReturn(mockResp);

        AssessmentSessionResponse res = videoInterviewService.finishVideoInterview(100L, 10L);
        assertNotNull(res);
        assertEquals("COMPLETED", res.getCurrentStage());

        verify(assessmentSessionService).completeVideoStage(
                eq(100L), eq(10L), anyDouble(), anyDouble(), anyDouble(), anyString(), anyString(),
                anyDouble(), anyDouble(), anyDouble(), anyString()
        );
    }

    @Test
    void testFinishVideoInterview_ThrowsWhenZeroUploaded() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));
        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(Collections.emptyList());

        assertThrows(BadRequestException.class, () -> videoInterviewService.finishVideoInterview(100L, 10L));
    }

    @Test
    void testUploadQuestionRecording_RejectsInvalidMagicBytes() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        VideoInterviewQuestion question = new VideoInterviewQuestion();
        question.setId(50L);
        question.setAssessmentSession(activeSession);
        question.setStatus("PENDING");

        when(videoInterviewQuestionRepository.findByIdAndAssessmentSessionId(50L, 100L))
                .thenReturn(Optional.of(question));

        // File pretending to be .webm but containing arbitrary non-video bytes
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file", "hacked.webm", "video/webm", new byte[]{0x01, 0x02, 0x03, 0x04, 0x05, 0x06}
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                videoInterviewService.uploadQuestionRecording(100L, 10L, 50L, invalidFile, 30)
        );
        assertTrue(ex.getMessage().contains("Invalid video container format"));
    }

    @Test
    void testDeleteCandidateRecordings_Success() throws IOException {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        Path tempDir = tempUploadDir;
        Path dummyFile = tempDir.resolve("sample_recording.webm");
        java.nio.file.Files.write(dummyFile, "dummy content".getBytes());

        VideoInterviewQuestion q1 = new VideoInterviewQuestion();
        q1.setId(50L);
        q1.setAssessmentSession(activeSession);
        q1.setStatus("UPLOADED");
        q1.setRecordingFilePath(dummyFile.toAbsolutePath().toString());
        q1.setRecordingFileSize(1234L);

        when(videoInterviewQuestionRepository.findByAssessmentSessionIdOrderBySequenceNumberAsc(100L))
                .thenReturn(List.of(q1));

        Map<String, Object> result = videoInterviewService.deleteCandidateRecordings(100L, 10L);

        assertNotNull(result);
        assertEquals(1, result.get("deletedFilesCount"));
        assertNull(q1.getRecordingFilePath());
        assertEquals(0L, q1.getRecordingFileSize());
        assertEquals("RECORDING_DELETED", q1.getStatus());
        assertNotNull(q1.getRecordingDeletedAt());
        assertFalse(java.nio.file.Files.exists(dummyFile));
        assertTrue(activeSession.getRecordingsDeletedByUser());
        assertNotNull(activeSession.getRecordingsDeletedAt());
    }

    @Test
    void testDeleteCandidateRecordings_Unauthorized() {
        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedAccessException.class, () ->
                videoInterviewService.deleteCandidateRecordings(100L, 999L)
        );
    }
}
