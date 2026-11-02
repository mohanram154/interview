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

        String rawDiff = request.getDifficulty() != null ? request.getDifficulty().trim().toUpperCase() : "INTERMEDIATE";
        String difficulty = switch (rawDiff) {
            case "EASY" -> "BEGINNER";
            case "MEDIUM" -> "INTERMEDIATE";
            case "HARD" -> "ADVANCED";
            default -> rawDiff;
        };
        String mode = request.getMode() != null ? request.getMode().toUpperCase() : "MCQ";
        int requestedCount = request.getQuestionCount() > 0 ? request.getQuestionCount() : 20;
        int questionCount = Math.max(1, Math.min(25, requestedCount));

        Set<Long> seenIds = new LinkedHashSet<>();
        List<Question> selectedQuestions = new ArrayList<>();

        if ("MCQ".equalsIgnoreCase(mode)) {
            // 1. Prioritize questions matching selected difficulty for this role
            List<Question> diffQuestions = new ArrayList<>(
                    questionRepository.findByJobRoleIdAndDifficultyIgnoreCaseAndQuestionTypeAndActiveTrue(jobRole.getId(), difficulty, "MCQ")
            );
            if (diffQuestions.isEmpty() && !rawDiff.equalsIgnoreCase(difficulty)) {
                diffQuestions = questionRepository.findByJobRoleIdAndDifficultyIgnoreCaseAndQuestionTypeAndActiveTrue(jobRole.getId(), rawDiff, "MCQ");
            }
            Collections.shuffle(diffQuestions);
            for (Question q : diffQuestions) {
                if (seenIds.add(q.getId())) {
                    selectedQuestions.add(q);
                }
                if (selectedQuestions.size() >= questionCount) break;
            }

            // 2. If we need more to reach requested count, pull from other difficulties of the same role
            if (selectedQuestions.size() < questionCount) {
                List<Question> roleQuestions = new ArrayList<>(
                        questionRepository.findByJobRoleIdAndQuestionTypeAndActiveTrue(jobRole.getId(), "MCQ")
                );
                Collections.shuffle(roleQuestions);
                for (Question q : roleQuestions) {
                    if (seenIds.add(q.getId())) {
                        selectedQuestions.add(q);
                    }
                    if (selectedQuestions.size() >= questionCount) break;
                }
            }

            // 3. Fallback to any active questions if still empty
            if (selectedQuestions.isEmpty()) {
                List<Question> anyQuestions = new ArrayList<>(questionRepository.findByJobRoleIdAndActiveTrue(jobRole.getId()));
                Collections.shuffle(anyQuestions);
                for (Question q : anyQuestions) {
                    if (seenIds.add(q.getId())) {
                        selectedQuestions.add(q);
                    }
                    if (selectedQuestions.size() >= questionCount) break;
                }
            }

            if (selectedQuestions.size() > questionCount) {
                selectedQuestions = new ArrayList<>(selectedQuestions.subList(0, questionCount));
            }
        } else {
            // Non-MCQ modes (TEXT, VOICE)
            List<Question> availableQuestions = questionRepository.findByJobRoleIdAndDifficultyIgnoreCaseAndActiveTrue(jobRole.getId(), difficulty);
            if (availableQuestions.isEmpty()) {
                availableQuestions = questionRepository.findByJobRoleIdAndActiveTrue(jobRole.getId());
            }
            if (availableQuestions.isEmpty()) {
                throw new BadRequestException("No questions available for role: " + jobRole.getName());
            }
            Collections.shuffle(availableQuestions);
            selectedQuestions = availableQuestions.stream()
                    .limit(Math.min(10, questionCount))
                    .collect(Collectors.toList());
        }

        if (selectedQuestions.isEmpty()) {
            throw new BadRequestException("No questions available for role: " + jobRole.getName());
        }

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
            iq.setOptionA(q.getOptionA());
            iq.setOptionB(q.getOptionB());
            iq.setOptionC(q.getOptionC());
            iq.setOptionD(q.getOptionD());
            iq.setCorrectOption(q.getCorrectOption());
            iq.setExplanation(q.getExplanation());
            iq.setQuestionType(q.getQuestionType() != null ? q.getQuestionType() : "MCQ");
            iq.setMarkedForReview(false);
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
        boolean isCompleted = "COMPLETED".equalsIgnoreCase(interview.getStatus());
        return questions.stream()
                .map(q -> mapToInterviewQuestionResponse(q, isCompleted))
                .collect(Collectors.toList());
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

        if (request.getMarkedForReview() != null) {
            question.setMarkedForReview(request.getMarkedForReview());
            interviewQuestionRepository.save(question);
        }

        boolean isMcq = "MCQ".equalsIgnoreCase(question.getQuestionType())
                || "MCQ".equalsIgnoreCase(interview.getMode())
                || (request.getSelectedOption() != null && !request.getSelectedOption().isBlank());

        if (isMcq) {
            // MCQ flow: allow changing answers before final submission
            Optional<Answer> existingOpt = answerRepository.findByInterviewQuestionId(question.getId());
            Answer answer = existingOpt.orElseGet(() -> new Answer(question, null));

            String selected = request.getSelectedOption() != null ? request.getSelectedOption().trim().toUpperCase() : null;
            if (selected != null) {
                answer.setSelectedOption(selected);
                answer.setAnswerText("Option " + selected);
                if (question.getCorrectOption() != null) {
                    answer.setIsCorrect(selected.equalsIgnoreCase(question.getCorrectOption().trim()));
                }
            } else if (request.getAnswerText() != null && !request.getAnswerText().isBlank()) {
                answer.setAnswerText(request.getAnswerText().trim());
            }

            answer.setAnswerStatus("SUBMITTED");
            answer.setSubmittedAt(LocalDateTime.now());
            Answer savedAnswer = answerRepository.save(answer);

            question.setAnswer(savedAnswer);
            interviewQuestionRepository.save(question);

            boolean isCompleted = "COMPLETED".equalsIgnoreCase(interview.getStatus());
            return mapToAnswerResponse(savedAnswer, isCompleted);
        } else {
            // Text/Voice interview flow
            if (answerRepository.existsByInterviewQuestionId(question.getId())) {
                throw new BadRequestException("An answer has already been submitted for this question.");
            }

            Answer answer = new Answer(question, request.getAnswerText() != null ? request.getAnswerText().trim() : "");
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

            return mapToAnswerResponse(savedAnswer, false);
        }
    }

    @Transactional
    public boolean toggleMarkForReview(Long interviewId, Long questionId, Long userId, Boolean marked) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getUser().getId().equals(userId)) {
            throw new UnauthorizedAccessException("You are not authorized to update this question.");
        }

        InterviewQuestion question = interviewQuestionRepository.findByIdAndInterviewId(questionId, interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found in this interview."));

        boolean newState = (marked != null) ? marked : !Boolean.TRUE.equals(question.getMarkedForReview());
        question.setMarkedForReview(newState);
        interviewQuestionRepository.save(question);
        return newState;
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

        boolean isCompleted = "COMPLETED".equalsIgnoreCase(interview.getStatus());
        List<InterviewQuestion> questions = interview.getQuestions();
        if (questions != null) {
            resp.setQuestions(questions.stream()
                    .map(q -> mapToInterviewQuestionResponse(q, isCompleted))
                    .collect(Collectors.toList()));
            long answered = questions.stream().filter(q -> q.getAnswer() != null).count();
            resp.setAnsweredQuestionsCount((int) answered);
        } else {
            resp.setQuestions(Collections.emptyList());
            resp.setAnsweredQuestionsCount(0);
        }

        return resp;
    }

    public InterviewQuestionResponse mapToInterviewQuestionResponse(InterviewQuestion iq) {
        boolean isCompleted = iq.getInterview() != null && "COMPLETED".equalsIgnoreCase(iq.getInterview().getStatus());
        return mapToInterviewQuestionResponse(iq, isCompleted);
    }

    public InterviewQuestionResponse mapToInterviewQuestionResponse(InterviewQuestion iq, boolean isCompleted) {
        InterviewQuestionResponse resp = new InterviewQuestionResponse();
        resp.setId(iq.getId());
        resp.setSequenceNumber(iq.getSequenceNumber());
        resp.setQuestionText(iq.getQuestionTextSnapshot());
        resp.setCategory(iq.getCategory());
        resp.setDifficulty(iq.getDifficulty());
        resp.setOptionA(iq.getOptionA());
        resp.setOptionB(iq.getOptionB());
        resp.setOptionC(iq.getOptionC());
        resp.setOptionD(iq.getOptionD());
        resp.setQuestionType(iq.getQuestionType() != null ? iq.getQuestionType() : "MCQ");
        resp.setMarkedForReview(Boolean.TRUE.equals(iq.getMarkedForReview()));

        // Security check: Only reveal correctOption and explanation AFTER submission/completion
        if (isCompleted) {
            resp.setCorrectOption(iq.getCorrectOption());
            resp.setExplanation(iq.getExplanation());
        }

        Answer answer = iq.getAnswer();
        if (answer == null && iq.getId() != null) {
            answer = answerRepository.findByInterviewQuestionId(iq.getId()).orElse(null);
        }
        if (answer != null) {
            resp.setAnswered(true);
            resp.setSelectedOption(answer.getSelectedOption());
            if (isCompleted) {
                resp.setIsCorrect(answer.getIsCorrect());
            }
            resp.setAnswer(mapToAnswerResponse(answer, isCompleted));
        } else {
            resp.setAnswered(false);
        }

        return resp;
    }

    public AnswerResponse mapToAnswerResponse(Answer answer) {
        return mapToAnswerResponse(answer, false);
    }

    public AnswerResponse mapToAnswerResponse(Answer answer, boolean isCompleted) {
        AnswerResponse resp = new AnswerResponse();
        resp.setId(answer.getId());
        resp.setInterviewQuestionId(answer.getInterviewQuestion().getId());
        resp.setAnswerText(answer.getAnswerText());
        resp.setSelectedOption(answer.getSelectedOption());
        if (isCompleted) {
            resp.setIsCorrect(answer.getIsCorrect());
        }
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
