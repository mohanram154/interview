package com.interview.platform.service;

import com.interview.platform.client.AiServiceClient;
import com.interview.platform.dto.ai.AiEvaluationRequest;
import com.interview.platform.dto.ai.AiEvaluationResponse;
import com.interview.platform.dto.interview.*;
import com.interview.platform.entity.*;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.exception.UnauthorizedAccessException;
import com.interview.platform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final QuestionRepository questionRepository;
    private final JobRoleRepository jobRoleRepository;
    private final UserRepository userRepository;
    private final AnswerRepository answerRepository;
    private final EvaluationRepository evaluationRepository;
    private final InterviewReportRepository reportRepository;
    private final AiServiceClient aiServiceClient;

    public InterviewService(
            InterviewRepository interviewRepository,
            InterviewQuestionRepository interviewQuestionRepository,
            QuestionRepository questionRepository,
            JobRoleRepository jobRoleRepository,
            UserRepository userRepository,
            AnswerRepository answerRepository,
            EvaluationRepository evaluationRepository,
            InterviewReportRepository reportRepository,
            AiServiceClient aiServiceClient
    ) {
        this.interviewRepository = interviewRepository;
        this.interviewQuestionRepository = interviewQuestionRepository;
        this.questionRepository = questionRepository;
        this.jobRoleRepository = jobRoleRepository;
        this.userRepository = userRepository;
        this.answerRepository = answerRepository;
        this.evaluationRepository = evaluationRepository;
        this.reportRepository = reportRepository;
        this.aiServiceClient = aiServiceClient;
    }

    @Transactional
    public InterviewResponse createInterview(Long userId, CreateInterviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        JobRole jobRole = jobRoleRepository.findById(request.getJobRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Job role not found with ID: " + request.getJobRoleId()));

        String difficulty = request.getDifficulty().toUpperCase();
        String mode = request.getMode().toUpperCase();
        int questionCount = Math.max(1, Math.min(10, request.getQuestionCount()));

        // Fetch questions for role
        List<Question> availableQuestions = questionRepository.findByJobRoleIdAndDifficultyIgnoreCaseAndActiveTrue(jobRole.getId(), difficulty);
        if (availableQuestions.isEmpty()) {
            availableQuestions = questionRepository.findByJobRoleIdAndActiveTrue(jobRole.getId());
        }

        if (availableQuestions.isEmpty()) {
            throw new BadRequestException("No questions available for role: " + jobRole.getName());
        }

        Collections.shuffle(availableQuestions);
        List<Question> selectedQuestions = availableQuestions.stream()
                .limit(questionCount)
                .collect(Collectors.toList());

        Interview interview = new Interview();
        interview.setUser(user);
        interview.setJobRole(jobRole);
        interview.setDifficulty(difficulty);
        interview.setMode(mode);
        interview.setStatus("IN_PROGRESS");
        interview.setTotalQuestions(selectedQuestions.size());
        interview.setStartedAt(LocalDateTime.now());

        Interview savedInterview = interviewRepository.save(interview);

        List<InterviewQuestion> interviewQuestions = new ArrayList<>();
        int seq = 1;
        for (Question q : selectedQuestions) {
            InterviewQuestion iq = new InterviewQuestion();
            iq.setInterview(savedInterview);
            iq.setQuestion(q);
            iq.setQuestionTextSnapshot(q.getQuestionText());
            iq.setSequenceNumber(seq++);
            iq.setCategory(q.getCategory());
            iq.setDifficulty(q.getDifficulty());
            iq.setExpectedTopics(q.getExpectedTopics());
            interviewQuestions.add(iq);
        }

        interviewQuestionRepository.saveAll(interviewQuestions);
        savedInterview.setQuestions(interviewQuestions);

        return mapToInterviewResponse(savedInterview);
    }

    @Transactional(readOnly = true)
    public InterviewResponse getInterviewById(Long interviewId, Long userId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to view this interview.");
        }

        return mapToInterviewResponse(interview);
    }

    @Transactional(readOnly = true)
    public List<InterviewQuestionResponse> getInterviewQuestions(Long interviewId, Long userId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to access these questions.");
        }

        List<InterviewQuestion> questions = interviewQuestionRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
        return questions.stream().map(this::mapToInterviewQuestionResponse).collect(Collectors.toList());
    }

    @Transactional
    public AnswerResponse submitAnswer(Long interviewId, Long userId, SubmitAnswerRequest request) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to submit answers for this interview.");
        }

        InterviewQuestion question = interviewQuestionRepository.findByIdAndInterviewId(request.getInterviewQuestionId(), interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found in this interview."));

        if (answerRepository.existsByInterviewQuestionId(question.getId())) {
            throw new BadRequestException("An answer has already been submitted for this question.");
        }

        // Persist Answer
        Answer answer = new Answer(question, request.getAnswerText().trim());
        Answer savedAnswer = answerRepository.save(answer);

        // Call AI Service
        AiEvaluationRequest aiRequest = new AiEvaluationRequest(
                question.getQuestionTextSnapshot(),
                savedAnswer.getAnswerText(),
                interview.getJobRole().getName(),
                question.getDifficulty(),
                question.getCategory(),
                question.getExpectedTopics()
        );

        AiEvaluationResponse aiResponse = aiServiceClient.evaluateAnswer(aiRequest);

        // Persist Evaluation
        Evaluation evaluation = new Evaluation();
        evaluation.setAnswer(savedAnswer);
        evaluation.setTechnicalAccuracyScore(aiResponse.getTechnicalAccuracyScore());
        evaluation.setRelevanceScore(aiResponse.getRelevanceScore());
        evaluation.setCompletenessScore(aiResponse.getCompletenessScore());
        evaluation.setClarityScore(aiResponse.getClarityScore());
        evaluation.setOverallScore(aiResponse.getOverallScore());
        evaluation.setSentimentLabel(aiResponse.getSentimentLabel());
        evaluation.setSentimentConfidence(aiResponse.getSentimentConfidence());
        evaluation.setFeedback(aiResponse.getFeedback() != null ? aiResponse.getFeedback() : "Evaluation completed.");
        evaluation.setStrengths(aiResponse.getStrengths() != null ? String.join(";;", aiResponse.getStrengths()) : "Good attempt.");
        evaluation.setImprovements(aiResponse.getImprovements() != null ? String.join(";;", aiResponse.getImprovements()) : "Continue practicing.");
        evaluation.setEvaluationStatus(aiResponse.getEvaluationStatus() != null ? aiResponse.getEvaluationStatus() : "COMPLETED");

        Evaluation savedEvaluation = evaluationRepository.save(evaluation);
        savedAnswer.setEvaluation(savedEvaluation);

        return mapToAnswerResponse(savedAnswer);
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> getUserInterviews(Long userId) {
        List<Interview> interviews = interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return interviews.stream().map(this::mapToInterviewResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(Long userId) {
        List<Interview> all = interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long total = all.size();
        long completed = all.stream().filter(i -> "COMPLETED".equalsIgnoreCase(i.getStatus())).count();

        Double avgScore = reportRepository.getAverageScoreByUserId(userId);
        double roundedAvg = avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0;

        List<InterviewResponse> recent = all.stream()
                .limit(5)
                .map(this::mapToInterviewResponse)
                .collect(Collectors.toList());

        return new DashboardStatsResponse(total, completed, roundedAvg, recent);
    }

    public InterviewResponse mapToInterviewResponse(Interview interview) {
        InterviewResponse resp = new InterviewResponse();
        resp.setId(interview.getId());
        resp.setUserId(interview.getUser().getId());
        resp.setJobRoleId(interview.getJobRole().getId());
        resp.setJobRoleName(interview.getJobRole().getName());
        resp.setDifficulty(interview.getDifficulty());
        resp.setMode(interview.getMode());
        resp.setStatus(interview.getStatus());
        resp.setTotalQuestions(interview.getTotalQuestions());
        resp.setStartedAt(interview.getStartedAt());
        resp.setCompletedAt(interview.getCompletedAt());

        List<InterviewQuestion> questions = interview.getQuestions();
        if (questions != null) {
            resp.setQuestions(questions.stream().map(this::mapToInterviewQuestionResponse).collect(Collectors.toList()));
            long answered = questions.stream().filter(q -> q.getAnswer() != null).count();
            resp.setAnsweredQuestionsCount((int) answered);
        } else {
            resp.setQuestions(Collections.emptyList());
            resp.setAnsweredQuestionsCount(0);
        }

        return resp;
    }

    public InterviewQuestionResponse mapToInterviewQuestionResponse(InterviewQuestion iq) {
        InterviewQuestionResponse resp = new InterviewQuestionResponse();
        resp.setId(iq.getId());
        resp.setSequenceNumber(iq.getSequenceNumber());
        resp.setQuestionText(iq.getQuestionTextSnapshot());
        resp.setCategory(iq.getCategory());
        resp.setDifficulty(iq.getDifficulty());

        Answer answer = iq.getAnswer();
        if (answer != null) {
            resp.setAnswered(true);
            resp.setAnswer(mapToAnswerResponse(answer));
        } else {
            resp.setAnswered(false);
        }

        return resp;
    }

    public AnswerResponse mapToAnswerResponse(Answer answer) {
        AnswerResponse resp = new AnswerResponse();
        resp.setId(answer.getId());
        resp.setInterviewQuestionId(answer.getInterviewQuestion().getId());
        resp.setAnswerText(answer.getAnswerText());
        resp.setAnswerStatus(answer.getAnswerStatus());
        resp.setSubmittedAt(answer.getSubmittedAt());

        Evaluation eval = answer.getEvaluation();
        if (eval != null) {
            EvaluationResponse evalResp = new EvaluationResponse();
            evalResp.setId(eval.getId());
            evalResp.setTechnicalAccuracyScore(eval.getTechnicalAccuracyScore());
            evalResp.setRelevanceScore(eval.getRelevanceScore());
            evalResp.setCompletenessScore(eval.getCompletenessScore());
            evalResp.setClarityScore(eval.getClarityScore());
            evalResp.setOverallScore(eval.getOverallScore());
            evalResp.setSentimentLabel(eval.getSentimentLabel());
            evalResp.setSentimentConfidence(eval.getSentimentConfidence());
            evalResp.setFeedback(eval.getFeedback());
            evalResp.setStrengths(eval.getStrengths());
            evalResp.setImprovements(eval.getImprovements());
            evalResp.setEvaluationStatus(eval.getEvaluationStatus());
            resp.setEvaluation(evalResp);
        }

        return resp;
    }
}
