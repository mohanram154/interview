package com.interview.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.platform.dto.report.AssessmentReportResponse;
import com.interview.platform.dto.report.ReportHistoryItemDto;
import com.interview.platform.entity.*;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.*;
import com.interview.platform.service.AssessmentReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentReportServiceTest {

    @Mock private AssessmentReportRepository reportRepository;
    @Mock private AssessmentSessionRepository sessionRepository;
    @Mock private ResumeEvaluationRepository resumeEvaluationRepository;
    @Mock private InterviewRepository interviewRepository;
    @Mock private VideoInterviewQuestionRepository videoQuestionRepository;

    private AssessmentReportService reportService;
    private ObjectMapper objectMapper;

    private User testUser;
    private JobRole javaRole;
    private AssessmentSession session;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        reportService = new AssessmentReportService(
                reportRepository,
                sessionRepository,
                resumeEvaluationRepository,
                interviewRepository,
                videoQuestionRepository,
                objectMapper
        );

        ReflectionTestUtils.setField(reportService, "resumeWeight", 0.30);
        ReflectionTestUtils.setField(reportService, "mcqWeight", 0.30);
        ReflectionTestUtils.setField(reportService, "videoWeight", 0.40);

        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Test Candidate");
        testUser.setEmail("test@candidate.com");

        javaRole = new JobRole();
        javaRole.setId(1L);
        javaRole.setName("Java Developer");

        session = new AssessmentSession();
        session.setId(100L);
        session.setUser(testUser);
        session.setJobRole(javaRole);
        session.setDifficulty("MEDIUM");
    }

    @Test
    void testIncompleteReportWhenResumeIncomplete() {
        session.setResumeStageStatus("IN_PROGRESS");
        session.setResumeScore(null);
        session.setMcqStageStatus("LOCKED");
        session.setVideoStageStatus("LOCKED");

        when(sessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(reportRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.empty());
        when(reportRepository.save(any(AssessmentReport.class))).thenAnswer(inv -> {
            AssessmentReport r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });

        AssessmentReportResponse report = reportService.getOrCreateReport(100L, 1L);

        assertNotNull(report);
        assertEquals("INCOMPLETE", report.getStatus());
        assertNull(report.getOverallScore(), "Overall score must be null if any round is incomplete");
        assertTrue(report.getIncompleteReason().contains("Resume Evaluation"));
        assertEquals(0.30, report.getResumeWeight());
        assertEquals(0.30, report.getMcqWeight());
        assertEquals(0.40, report.getVideoWeight());
    }

    @Test
    void testIncompleteReportWhenVideoIncomplete() {
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(80.0);
        session.setMcqStageStatus("COMPLETED");
        session.setMcqScore(90.0);
        session.setVideoStageStatus("IN_PROGRESS");
        session.setVideoScore(null);

        when(sessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(reportRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.empty());
        when(reportRepository.save(any(AssessmentReport.class))).thenAnswer(inv -> inv.getArgument(0));

        AssessmentReportResponse report = reportService.getOrCreateReport(100L, 1L);

        assertEquals("INCOMPLETE", report.getStatus());
        assertNull(report.getOverallScore(), "Overall score must NOT be generated when Round 3 is incomplete");
        assertEquals(80.0, report.getResumeScore());
        assertEquals(90.0, report.getMcqScore());
        assertNull(report.getVideoScore());
    }

    @Test
    void testCompleteReportWithCorrectWeightedFormula() {
        // Resume: 80.0, MCQ: 90.0, Video: 85.0
        // Formula: (80 * 0.30) + (90 * 0.30) + (85 * 0.40) = 24.0 + 27.0 + 34.0 = 85.0
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(80.0);
        session.setMcqStageStatus("COMPLETED");
        session.setMcqScore(90.0);
        session.setVideoStageStatus("COMPLETED");
        session.setVideoScore(85.0);
        session.setVideoTechnicalScore(88.0);
        session.setVideoCommunicationScore(82.0);
        session.setVideoFluencyScore(80.0);
        session.setVideoConfidenceCalibrationLabel("CALIBRATED");

        when(sessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(reportRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.empty());
        when(reportRepository.save(any(AssessmentReport.class))).thenAnswer(inv -> {
            AssessmentReport r = inv.getArgument(0);
            r.setId(10L);
            return r;
        });

        AssessmentReportResponse report = reportService.getOrCreateReport(100L, 1L);

        assertEquals("COMPLETED", report.getStatus());
        assertNotNull(report.getOverallScore());
        assertEquals(85.0, report.getOverallScore(), 0.01);
        assertEquals(0.30, report.getResumeWeight());
        assertEquals(0.30, report.getMcqWeight());
        assertEquals(0.40, report.getVideoWeight());
        assertEquals("Overall Score = (Resume Score × 0.30) + (MCQ Score × 0.30) + (Video Score × 0.40)", report.getFormulaText());

        // Verify independent scorecards exist
        assertNotNull(report.getResumeCard());
        assertNotNull(report.getMcqCard());
        assertNotNull(report.getVideoCard());

        // Verify synthesized sections exist
        assertNotNull(report.getOverallStrengths());
        assertNotNull(report.getOverallSkillGaps());
        assertNotNull(report.getLearningRoadmap());
        assertNotNull(report.getDisclaimer());
        assertTrue(report.getDisclaimer().contains("decision-support aids"));
    }

    @Test
    void testPreventDuplicateReportGeneration() {
        session.setResumeStageStatus("COMPLETED");
        session.setResumeScore(80.0);
        session.setMcqStageStatus("COMPLETED");
        session.setMcqScore(90.0);
        session.setVideoStageStatus("COMPLETED");
        session.setVideoScore(85.0);

        AssessmentReport existing = new AssessmentReport();
        existing.setId(5L);
        existing.setAssessmentSession(session);
        existing.setUser(testUser);
        existing.setJobRoleName("Java Developer");
        existing.setDifficulty("MEDIUM");
        existing.setStatus("COMPLETED");
        existing.setOverallScore(85.0);
        existing.setResumeWeight(0.30);
        existing.setMcqWeight(0.30);
        existing.setVideoWeight(0.40);

        when(sessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(reportRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.of(existing));

        AssessmentReportResponse report = reportService.getOrCreateReport(100L, 1L);

        assertEquals(5L, report.getId());
        assertEquals(85.0, report.getOverallScore());
        // Verify save was NOT called for duplicate insertion
        verify(reportRepository, never()).save(any(AssessmentReport.class));
    }

    @Test
    void testEnforcesOwnership() {
        when(sessionRepository.findById(100L)).thenReturn(Optional.of(session));

        // User ID 2 attempts to view session belonging to User ID 1
        assertThrows(UnauthorizedAccessException.class, () -> reportService.getOrCreateReport(100L, 2L));
    }

    @Test
    void testUserReportHistory() {
        AssessmentReport r1 = new AssessmentReport();
        r1.setId(1L);
        r1.setAssessmentSession(session);
        r1.setUser(testUser);
        r1.setJobRoleName("Java Developer");
        r1.setDifficulty("MEDIUM");
        r1.setStatus("COMPLETED");
        r1.setOverallScore(88.0);
        r1.setCreatedAt(LocalDateTime.now());

        when(reportRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(r1));

        List<ReportHistoryItemDto> history = reportService.getUserReportHistory(1L);

        assertEquals(1, history.size());
        assertEquals(88.0, history.get(0).getOverallScore());
        assertEquals("Java Developer", history.get(0).getJobRoleName());
    }
}
