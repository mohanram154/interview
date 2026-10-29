package com.interview.platform;

import com.interview.platform.client.AiServiceClient;
import com.interview.platform.dto.ai.AiEvaluationResponse;
import com.interview.platform.dto.interview.CreateInterviewRequest;
import com.interview.platform.dto.interview.InterviewResponse;
import com.interview.platform.dto.interview.ReportResponse;
import com.interview.platform.dto.interview.SubmitAnswerRequest;
import com.interview.platform.entity.*;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.*;
import com.interview.platform.service.InterviewService;
import com.interview.platform.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewServiceTest {

    @Mock private InterviewRepository interviewRepository;
    @Mock private InterviewQuestionRepository interviewQuestionRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private JobRoleRepository jobRoleRepository;
    @Mock private UserRepository userRepository;
    @Mock private AnswerRepository answerRepository;
    @Mock private EvaluationRepository evaluationRepository;
    @Mock private InterviewReportRepository reportRepository;
    @Mock private AiServiceClient aiServiceClient;

    private InterviewService interviewService;
    private ReportService reportService;

    @BeforeEach
    void setUp() {
        interviewService = new InterviewService(
                interviewRepository,
                interviewQuestionRepository,
                questionRepository,
                jobRoleRepository,
                userRepository,
                answerRepository,
                evaluationRepository,
                reportRepository,
                aiServiceClient
        );
        reportService = new ReportService(
                interviewRepository,
                reportRepository,
                interviewService
        );
    }

    @Test
    void testCreateInterviewSuccess() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Core Java and Spring");
        role.setId(1L);

        Question q1 = new Question();
        q1.setId(101L);
        q1.setJobRole(role);
        q1.setQuestionText("Explain HashMap internals");
        q1.setCategory("Core Java");
        q1.setDifficulty("INTERMEDIATE");
        q1.setExpectedTopics("bucket, hashing");

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(jobRoleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(questionRepository.findByJobRoleIdAndDifficultyIgnoreCaseAndActiveTrue(1L, "INTERMEDIATE"))
                .thenReturn(Collections.singletonList(q1));

        Interview interview = new Interview();
        interview.setId(500L);
        interview.setUser(user);
        interview.setJobRole(role);
        interview.setDifficulty("INTERMEDIATE");
        interview.setTotalQuestions(1);

        when(interviewRepository.save(any(Interview.class))).thenReturn(interview);

        CreateInterviewRequest req = new CreateInterviewRequest();
        req.setJobRoleId(1L);
        req.setDifficulty("INTERMEDIATE");
        req.setMode("TEXT");
        req.setQuestionCount(1);

        InterviewResponse resp = interviewService.createInterview(10L, req);

        assertNotNull(resp);
        assertEquals(500L, resp.getId());
        assertEquals("Java Developer", resp.getJobRoleName());
        verify(interviewQuestionRepository, times(1)).saveAll(any());
    }

    @Test
    void testUnauthorizedUserCannotAccessInterview() {
        User owner = new User("Owner", "owner@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        owner.setId(10L);

        Interview interview = new Interview();
        interview.setId(500L);
        interview.setUser(owner);

        when(interviewRepository.findById(500L)).thenReturn(Optional.of(interview));

        // User 99 tries to access User 10's interview
        assertThrows(UnauthorizedAccessException.class, () -> interviewService.getInterviewById(500L, 99L));
    }

    @Test
    void testDuplicateAnswerThrowsBadRequest() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        Interview interview = new Interview();
        interview.setId(500L);
        interview.setUser(user);

        InterviewQuestion iq = new InterviewQuestion();
        iq.setId(201L);
        iq.setInterview(interview);

        when(interviewRepository.findById(500L)).thenReturn(Optional.of(interview));
        when(interviewQuestionRepository.findByIdAndInterviewId(201L, 500L)).thenReturn(Optional.of(iq));
        when(answerRepository.existsByInterviewQuestionId(201L)).thenReturn(true);

        SubmitAnswerRequest req = new SubmitAnswerRequest(201L, "My repeated answer");

        assertThrows(BadRequestException.class, () -> interviewService.submitAnswer(500L, 10L, req));
    }

    @Test
    void testCompleteInterviewGeneratesReport() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        Interview interview = new Interview();
        interview.setId(500L);
        interview.setUser(user);
        interview.setJobRole(role);
        interview.setDifficulty("INTERMEDIATE");
        interview.setMode("TEXT");
        interview.setTotalQuestions(1);

        InterviewQuestion iq = new InterviewQuestion();
        iq.setId(201L);
        iq.setInterview(interview);

        Answer answer = new Answer(iq, "Detailed technical answer");
        Evaluation eval = new Evaluation();
        eval.setTechnicalAccuracyScore(85.0);
        eval.setRelevanceScore(90.0);
        eval.setCompletenessScore(80.0);
        eval.setClarityScore(85.0);
        eval.setOverallScore(85.5);
        eval.setStrengths("Strong core knowledge;;Accurate terms");
        eval.setImprovements("Discuss edge cases");
        answer.setEvaluation(eval);
        iq.setAnswer(answer);

        interview.setQuestions(Collections.singletonList(iq));

        when(interviewRepository.findById(500L)).thenReturn(Optional.of(interview));
        when(reportRepository.findByInterviewId(500L)).thenReturn(Optional.empty());

        InterviewReport savedReport = new InterviewReport();
        savedReport.setId(1L);
        savedReport.setInterview(interview);
        savedReport.setOverallScore(85.5);
        savedReport.setTechnicalScore(85.0);
        savedReport.setCommunicationScore(85.0);
        savedReport.setSummary("Great interview");
        savedReport.setStrengths("Strong core knowledge;;Accurate terms");
        savedReport.setImprovementAreas("Discuss edge cases");
        savedReport.setRecommendations("Practice advanced topics");
        savedReport.setReportStatus("COMPLETED");

        when(reportRepository.save(any(InterviewReport.class))).thenReturn(savedReport);

        ReportResponse reportResp = reportService.completeInterview(500L, 10L);

        assertNotNull(reportResp);
        assertEquals(85.5, reportResp.getOverallScore());
        assertEquals("COMPLETED", interview.getStatus());
        verify(interviewRepository, times(1)).save(interview);
    }
}
