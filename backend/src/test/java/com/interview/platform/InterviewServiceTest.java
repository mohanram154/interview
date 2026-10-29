package com.interview.platform;

import com.interview.platform.client.AiServiceClient;
import com.interview.platform.dto.interview.CreateInterviewRequest;
import com.interview.platform.dto.interview.InterviewQuestionResponse;
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
        interview.setMode("TEXT");
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
    void testCreateMcqInterviewSuccess() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Core Java and Spring");
        role.setId(1L);

        List<Question> mcqList = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            Question q = new Question();
            q.setId((long) (100 + i));
            q.setJobRole(role);
            q.setQuestionText("What is feature " + i + "?");
            q.setOptionA("A" + i);
            q.setOptionB("B" + i);
            q.setOptionC("C" + i);
            q.setOptionD("D" + i);
            q.setCorrectOption("A");
            q.setExplanation("Explanation " + i);
            q.setCategory("Core Java");
            q.setDifficulty("INTERMEDIATE");
            q.setQuestionType("MCQ");
            mcqList.add(q);
        }

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(jobRoleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(questionRepository.findByJobRoleIdAndDifficultyIgnoreCaseAndQuestionTypeAndActiveTrue(1L, "INTERMEDIATE", "MCQ"))
                .thenReturn(mcqList);

        Interview interview = new Interview();
        interview.setId(600L);
        interview.setUser(user);
        interview.setJobRole(role);
        interview.setDifficulty("INTERMEDIATE");
        interview.setMode("MCQ");
        interview.setTotalQuestions(20);

        when(interviewRepository.save(any(Interview.class))).thenReturn(interview);

        CreateInterviewRequest req = new CreateInterviewRequest();
        req.setJobRoleId(1L);
        req.setDifficulty("INTERMEDIATE");
        req.setMode("MCQ");
        req.setQuestionCount(20);

        InterviewResponse resp = interviewService.createInterview(10L, req);

        assertNotNull(resp);
        assertEquals(600L, resp.getId());
        assertEquals("MCQ", resp.getMode());
        verify(interviewQuestionRepository, times(1)).saveAll(any());
    }

    @Test
    void testSubmitAndChangeMcqAnswer() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        Interview interview = new Interview();
        interview.setId(500L);
        interview.setUser(user);
        interview.setMode("MCQ");
        interview.setStatus("IN_PROGRESS");

        InterviewQuestion iq = new InterviewQuestion();
        iq.setId(201L);
        iq.setInterview(interview);
        iq.setQuestionType("MCQ");
        iq.setCorrectOption("B");

        when(interviewRepository.findById(500L)).thenReturn(Optional.of(interview));
        when(interviewQuestionRepository.findByIdAndInterviewId(201L, 500L)).thenReturn(Optional.of(iq));

        Answer existingAnswer = new Answer(iq, "Option A");
        existingAnswer.setSelectedOption("A");
        existingAnswer.setIsCorrect(false);

        // When submitted first time or changed
        when(answerRepository.findByInterviewQuestionId(201L)).thenReturn(Optional.of(existingAnswer));
        when(answerRepository.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubmitAnswerRequest req = new SubmitAnswerRequest();
        req.setInterviewQuestionId(201L);
        req.setSelectedOption("B"); // change answer to B (correct)

        var resp = interviewService.submitAnswer(500L, 10L, req);

        assertNotNull(resp);
        assertEquals("B", resp.getSelectedOption());
        // Since interview is IN_PROGRESS, isCorrect must be hidden from candidate
        assertNull(resp.getIsCorrect());
        // But underlying answer is saved as correct
        assertTrue(existingAnswer.getIsCorrect());
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
    void testDuplicateAnswerThrowsBadRequestForTextMode() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        Interview interview = new Interview();
        interview.setId(500L);
        interview.setUser(user);
        interview.setMode("TEXT");

        InterviewQuestion iq = new InterviewQuestion();
        iq.setId(201L);
        iq.setInterview(interview);
        iq.setQuestionType("TEXT");

        when(interviewRepository.findById(500L)).thenReturn(Optional.of(interview));
        when(interviewQuestionRepository.findByIdAndInterviewId(201L, 500L)).thenReturn(Optional.of(iq));
        when(answerRepository.existsByInterviewQuestionId(201L)).thenReturn(true);

        SubmitAnswerRequest req = new SubmitAnswerRequest(201L, "My repeated answer");

        assertThrows(BadRequestException.class, () -> interviewService.submitAnswer(500L, 10L, req));
    }

    @Test
    void testCompleteMcqInterviewScoring() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        Interview interview = new Interview();
        interview.setId(700L);
        interview.setUser(user);
        interview.setJobRole(role);
        interview.setDifficulty("INTERMEDIATE");
        interview.setMode("MCQ");
        interview.setTotalQuestions(4);

        // 4 questions: 2 correct, 1 incorrect, 1 unanswered
        List<InterviewQuestion> questions = new ArrayList<>();

        // Q1: Correct
        InterviewQuestion q1 = new InterviewQuestion();
        q1.setId(1L);
        q1.setInterview(interview);
        q1.setQuestionType("MCQ");
        q1.setCorrectOption("A");
        q1.setCategory("Core Java");
        Answer a1 = new Answer(q1, "Option A");
        a1.setSelectedOption("A");
        a1.setIsCorrect(true);
        q1.setAnswer(a1);
        questions.add(q1);

        // Q2: Correct
        InterviewQuestion q2 = new InterviewQuestion();
        q2.setId(2L);
        q2.setInterview(interview);
        q2.setQuestionType("MCQ");
        q2.setCorrectOption("C");
        q2.setCategory("Multithreading");
        Answer a2 = new Answer(q2, "Option C");
        a2.setSelectedOption("C");
        a2.setIsCorrect(true);
        q2.setAnswer(a2);
        questions.add(q2);

        // Q3: Incorrect
        InterviewQuestion q3 = new InterviewQuestion();
        q3.setId(3L);
        q3.setInterview(interview);
        q3.setQuestionType("MCQ");
        q3.setCorrectOption("D");
        q3.setCategory("Spring Boot");
        Answer a3 = new Answer(q3, "Option B");
        a3.setSelectedOption("B");
        a3.setIsCorrect(false);
        q3.setAnswer(a3);
        questions.add(q3);

        // Q4: Unanswered
        InterviewQuestion q4 = new InterviewQuestion();
        q4.setId(4L);
        q4.setInterview(interview);
        q4.setQuestionType("MCQ");
        q4.setCorrectOption("B");
        q4.setCategory("JVM Internals");
        questions.add(q4);

        interview.setQuestions(questions);

        when(interviewRepository.findById(700L)).thenReturn(Optional.of(interview));
        when(reportRepository.findByInterviewId(700L)).thenReturn(Optional.empty());
        when(reportRepository.save(any(InterviewReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReportResponse report = reportService.completeInterview(700L, 10L);

        assertNotNull(report);
        assertEquals(4, report.getTotalQuestionsCount());
        assertEquals(2, report.getCorrectAnswersCount());
        assertEquals(1, report.getIncorrectAnswersCount());
        assertEquals(1, report.getUnansweredCount());
        // Score = (2 / 4) * 100 = 50.0%
        assertEquals(50.0, report.getOverallScore());
        assertEquals("COMPLETED", interview.getStatus());
        assertTrue(report.getImprovementAreas().contains("Spring Boot") || report.getImprovementAreas().contains("JVM Internals"));
        assertTrue(report.getStrengths().contains("Core Java") || report.getStrengths().contains("Multithreading"));
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
