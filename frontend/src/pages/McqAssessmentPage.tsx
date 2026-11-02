import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../api/assessmentApi';
import { apiClient } from '../api/client';
import { AssessmentSession } from '../types/assessment';
import { AssessmentStageGuard } from '../components/assessment/AssessmentStageGuard';
import { AssessmentStageStepper } from '../components/assessment/AssessmentStageStepper';
import { Interview, InterviewQuestion } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Bookmark, 
  BookmarkCheck, 
  Check, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Volume2, 
  VolumeX,
  X,
  Award,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  Layers
} from 'lucide-react';

export const McqAssessmentPage: React.FC = () => {
  return (
    <AssessmentStageGuard requiredStage="MCQ_ASSESSMENT">
      {({ session, reloadSession }) => (
        <McqRoundContent session={session} onUpdated={reloadSession} />
      )}
    </AssessmentStageGuard>
  );
};

interface ContentProps {
  session: AssessmentSession;
  onUpdated: () => Promise<void>;
}

const McqRoundContent: React.FC<ContentProps> = ({ session, onUpdated }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [savingAnswer, setSavingAnswer] = useState<boolean>(false);
  const [submittingRound, setSubmittingRound] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [report, setReport] = useState<any | null>(null);
  const [showReview, setShowReview] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pendingSavesRef = useRef<Map<number, Promise<any>>>(new Map());

  // Audio synthesis
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Initialize or fetch existing MCQ interview
  const initMcqRound = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start or resume MCQ interview via assessment endpoint with configured question count
      const interviewResp = await assessmentApi.startOrResumeMcqRound(session.id, session.questionCount || 20);
      setInterview(interviewResp);

      // Fetch fresh question list
      const qsRes = await apiClient.get<ApiResponse<InterviewQuestion[]>>(`/interviews/${interviewResp.id}/questions`);
      if (qsRes.data.success) {
        const qs = qsRes.data.data;

        // Map any already submitted answers accurately
        const ansMap: Record<number, string> = {};
        const normalized = qs.map(q => {
          const opt = (q.selectedOption || q.answer?.selectedOption || '').toUpperCase();
          const hasAnswer = Boolean(opt && opt.trim().length > 0) || Boolean(q.answered);
          if (opt) {
            ansMap[q.id] = opt;
          }
          return {
            ...q,
            answered: hasAnswer,
            selectedOption: opt || q.selectedOption
          };
        });

        setQuestions(normalized);
        setSelectedAnswers(ansMap);
      }

      // If already completed, load full report with answers and explanations
      if (session.mcqStageStatus === 'COMPLETED') {
        try {
          const repRes = await apiClient.get<ApiResponse<any>>(`/interviews/${interviewResp.id}/report`);
          if (repRes.data.success) {
            setReport(repRes.data.data);
          }
        } catch (repErr) {
          console.warn('Could not load report for completed MCQ interview', repErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to initialize MCQ round:', err);
      setError(err.response?.data?.message || 'Failed to initialize MCQ Technical Assessment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initMcqRound();

    return () => {
      if (hasSpeechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [session.id]);

  const currentQuestion = questions[currentIndex];

  // Handle option selection & save to backend
  const handleSelectOption = async (optionKey: string) => {
    if (!currentQuestion || !interview || session.mcqStageStatus === 'COMPLETED') return;

    const opt = optionKey.toUpperCase();
    const qId = currentQuestion.id;

    // 1. Immediate optimistic UI updates so user sees answer selected & answered count update without delay
    setSelectedAnswers(prev => ({ ...prev, [qId]: opt }));
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          answered: true,
          selectedOption: opt,
          answer: {
            ...(q.answer || ({} as any)),
            interviewQuestionId: q.id,
            selectedOption: opt,
            answerText: `Option ${opt}`,
            answerStatus: 'SUBMITTED',
            submittedAt: new Date().toISOString()
          }
        };
      }
      return q;
    }));

    // 2. Track autosave in pendingSavesRef so submit never misses in-flight saves
    const savePromise = (async () => {
      try {
        setSavingAnswer(true);
        const res = await apiClient.post<ApiResponse<any>>(`/interviews/${interview.id}/answers`, {
          interviewQuestionId: qId,
          selectedOption: opt,
          answerText: `Option ${opt}`
        });

        if (res.data.success && res.data.data) {
          setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
              return {
                ...q,
                answered: true,
                selectedOption: opt,
                answer: res.data.data
              };
            }
            return q;
          }));
        }
      } catch (err: any) {
        console.error('Failed to save answer option:', err);
        setError(`Failed to record your answer for Question ${currentIndex + 1}. Please tap the option again.`);
      } finally {
        setSavingAnswer(false);
        pendingSavesRef.current.delete(qId);
      }
    })();

    pendingSavesRef.current.set(qId, savePromise);
    await savePromise;
  };

  // Toggle Mark for Review
  const handleToggleReview = async () => {
    if (!currentQuestion || !interview || session.mcqStageStatus === 'COMPLETED') return;

    const newMarked = !currentQuestion.markedForReview;
    try {
      await apiClient.put(`/interviews/${interview.id}/questions/${currentQuestion.id}/review?marked=${newMarked}`);
      setQuestions(prev => prev.map(q => {
        if (q.id === currentQuestion.id) {
          return { ...q, markedForReview: newMarked };
        }
        return q;
      }));
    } catch (err) {
      console.error('Failed to update review flag:', err);
    }
  };

  // Text-to-Speech
  const handleToggleSpeak = () => {
    if (!hasSpeechSynthesis || !currentQuestion) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const optionsText = ` Options: A, ${currentQuestion.optionA || ''}. B, ${currentQuestion.optionB || ''}. C, ${currentQuestion.optionC || ''}. D, ${currentQuestion.optionD || ''}.`;
    const textToSpeak = `${currentQuestion.questionText}.${optionsText}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Submit MCQ Round
  const handleSubmitInterview = async () => {
    if (!interview) return;

    try {
      setSubmittingRound(true);
      setShowConfirmModal(false);

      // Await any in-flight answer save requests before completing interview
      if (pendingSavesRef.current.size > 0) {
        await Promise.all(Array.from(pendingSavesRef.current.values()));
      }

      // 1. Complete interview on backend
      const reportRes = await apiClient.post<ApiResponse<any>>(`/interviews/${interview.id}/complete`);
      const score = reportRes.data.data?.overallScore || 0;
      if (reportRes.data.data) {
        setReport(reportRes.data.data);
      }

      // 2. Complete stage on assessment session
      await assessmentApi.completeMcqRound(session.id, {
        mcqInterviewId: interview.id,
        score
      });

      await onUpdated();
    } catch (err: any) {
      console.error('Error completing MCQ round:', err);
      setError(err.response?.data?.message || 'Failed to submit MCQ assessment.');
    } finally {
      setSubmittingRound(false);
    }
  };

  const isQuestionAnswered = (q: InterviewQuestion) => {
    return Boolean(
      q.answered || 
      (q.selectedOption && q.selectedOption.trim().length > 0) || 
      (selectedAnswers[q.id] && selectedAnswers[q.id].trim().length > 0)
    );
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const unansweredCount = questions.length - answeredCount;
  const markedCount = questions.filter(q => q.markedForReview).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Preparing MCQ Technical Assessment</h2>
        <p className="text-xs text-gray-500 mt-1">Loading 20 technical domain questions...</p>
      </div>
    );
  }

  // If already completed in the session
  if (session.mcqStageStatus === 'COMPLETED' && session.mcqScore != null) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to={`/assessment/${session.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Assessment Hub
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Round 2 of 3: Completed
            </span>
          </div>

          <div className="mb-8">
            <AssessmentStageStepper
              session={session}
              activeStage="MCQ_ASSESSMENT"
              onNavigateStage={(stg) => {
                if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
                else if (stg === 'VIDEO_INTERVIEW' && session.videoUnlocked) navigate(`/assessment/${session.id}/video`);
                else if (stg === 'FINAL_REPORT' && session.finalReportUnlocked) navigate(`/assessment/${session.id}/report`);
              }}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Round 2 Completed</span>
                    <h3 className="text-xl font-bold text-gray-900">MCQ Technical Assessment Scored</h3>
                    <p className="text-xs text-gray-600">20 Questions • {session.jobRoleName} ({session.difficulty})</p>
                  </div>
                </div>

                <div className="text-right bg-white px-5 py-3 rounded-2xl border border-emerald-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">MCQ Score</div>
                  <div className="text-3xl font-black text-emerald-700">{session.mcqScore}%</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-xs text-gray-700 leading-relaxed">
                Your MCQ answers have been recorded and evaluated by the system. Stage 3 (AI Video Interview) is now unlocked.
              </div>
            </div>

            {/* Stage 3 Unlock Box */}
            <div className="bg-violet-50 border border-violet-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Stage 3 Unlocked: AI Video Interview</h4>
                  <p className="text-xs text-gray-600">Proceed to the interactive video round with real-time sentiment analysis.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/assessment/${session.id}/video`)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-xs transition-colors inline-flex items-center justify-center gap-2"
              >
                Proceed to Round 3 (Video) <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Performance Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Questions</div>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {report?.totalQuestionsCount || questions.length || session.questionCount || 20}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Correct (+1)</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {report?.correctAnswersCount ?? Math.round(((session.mcqScore || 0) / 100) * (questions.length || session.questionCount || 20))}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">Incorrect (0)</div>
                <div className="text-2xl font-black text-rose-700 mt-1">
                  {report?.incorrectAnswersCount ?? 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Unanswered (0)</div>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  {report?.unansweredCount ?? 0}
                </div>
              </div>
            </div>

            {/* Topic-Wise Performance */}
            {report && (
              <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-600" /> Topic-Wise Competency Analysis
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Demonstrated Strengths
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.strengths && report.strengths.length > 0 ? (
                        report.strengths.map((str: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200">
                            {str}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">Solid performance across all questions</span>
                      )}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Focus & Revision Topics
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.improvementAreas && report.improvementAreas.length > 0 ? (
                        report.improvementAreas.map((imp: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-amber-900 border border-amber-200">
                            {imp}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No major weakness areas identified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question-by-Question Review with Explanations */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600" /> Detailed Question Review & Explanations
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">Review every question, your selected answer, and technical explanations.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReview(prev => !prev)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5 transition-colors"
                >
                  {showReview ? (
                    <>Hide Review <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Show Review ({report?.questions?.length || questions.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

              {showReview && (
                <div className="space-y-4 pt-2">
                  {(report?.questions || questions).map((q: any, idx: number) => {
                    const candidateAns = q.selectedOption || selectedAnswers[q.id];
                    const correctAns = q.correctOption;
                    const isCorrect = q.isCorrect ?? (candidateAns && correctAns ? candidateAns.toUpperCase() === correctAns.toUpperCase() : false);
                    const isAnswered = Boolean(candidateAns);

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-5 rounded-2xl border transition-all ${
                          !isAnswered
                            ? 'border-gray-200 bg-gray-50/40'
                            : isCorrect
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : 'border-rose-200 bg-rose-50/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                              Q{idx + 1}
                            </span>
                            {q.category && (
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                {q.category}
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-gray-400">
                              {q.difficulty}
                            </span>
                          </div>

                          <div>
                            {!isAnswered ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                Unanswered
                              </span>
                            ) : isCorrect ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Correct (+1)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                                <X className="w-3 h-3 text-rose-600" /> Incorrect (0)
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm font-bold text-gray-900 mb-4 leading-snug">
                          {q.questionText}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          {(['A', 'B', 'C', 'D'] as const).map((key) => {
                            const optVal =
                              key === 'A' ? q.optionA :
                              key === 'B' ? q.optionB :
                              key === 'C' ? q.optionC :
                              q.optionD;
                            if (!optVal) return null;

                            const isSelected = candidateAns === key;
                            const isCorrectOpt = correctAns === key;

                            let optStyle = 'border-gray-200 bg-white text-gray-700';
                            if (isCorrectOpt) {
                              optStyle = 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                            } else if (isSelected && !isCorrect) {
                              optStyle = 'border-rose-300 bg-rose-50 text-rose-900 line-through';
                            }

                            return (
                              <div
                                key={key}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${optStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isCorrectOpt
                                      ? 'bg-emerald-600 text-white'
                                      : isSelected
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {key}
                                  </span>
                                  <span>{optVal}</span>
                                </div>
                                {isCorrectOpt && (
                                  <span className="text-[10px] font-bold text-emerald-700 shrink-0 uppercase tracking-wide">
                                    Correct Answer
                                  </span>
                                )}
                                {isSelected && !isCorrectOpt && (
                                  <span className="text-[10px] font-bold text-rose-700 shrink-0 uppercase tracking-wide">
                                    Your Choice
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {q.explanation && (
                          <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-100 text-xs text-violet-950 leading-relaxed">
                            <span className="font-bold text-violet-900 flex items-center gap-1.5 mb-1">
                              <BookOpen className="w-3.5 h-3.5 text-violet-700" /> Explanation:
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation & Session Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link
            to={`/assessment/${session.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Assessment Hub
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">
              {session.jobRoleName} • {session.difficulty}
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
              Round 2 of 3: MCQ Assessment
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-6">
          <AssessmentStageStepper
            session={session}
            activeStage="MCQ_ASSESSMENT"
            onNavigateStage={(stg) => {
              if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stg === 'VIDEO_INTERVIEW' && session.videoUnlocked) navigate(`/assessment/${session.id}/video`);
            }}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MCQ Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Panel (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            {currentQuestion ? (
              <div>
                {/* Header: Question Number & Actions */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    {(selectedAnswers[currentQuestion.id] || currentQuestion.selectedOption) ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Saved
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Not answered
                      </span>
                    )}
                    {currentQuestion.category && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md hidden sm:inline">
                        {currentQuestion.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio read-aloud */}
                    {hasSpeechSynthesis && (
                      <button
                        type="button"
                        onClick={handleToggleSpeak}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isSpeaking 
                            ? 'bg-violet-600 text-white border-violet-600' 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                        title="Listen to question"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                      </button>
                    )}

                    {/* Mark for review */}
                    <button
                      type="button"
                      onClick={handleToggleReview}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        currentQuestion.markedForReview
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {currentQuestion.markedForReview ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 text-amber-600" />
                          <span className="hidden sm:inline">Marked</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          <span className="hidden sm:inline">Mark for Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 leading-snug">
                  {currentQuestion.questionText}
                </h2>

                {/* 4 Options: A, B, C, D */}
                <div className="space-y-3 mb-8">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const value =
                      key === 'A' ? currentQuestion.optionA :
                      key === 'B' ? currentQuestion.optionB :
                      key === 'C' ? currentQuestion.optionC :
                      currentQuestion.optionD;

                    if (!value) return null;
                    const selectedKey = selectedAnswers[currentQuestion.id] || currentQuestion.selectedOption;
                    const isSelected = selectedKey === key;

                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleSelectOption(key)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/60 shadow-xs ring-2 ring-violet-500/20'
                            : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50/50 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {key}
                          </div>
                          <span className={`text-sm font-medium leading-relaxed ${
                            isSelected ? 'text-violet-950 font-semibold' : 'text-gray-800'
                          }`}>
                            {value}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-100/70 px-2.5 py-1 rounded-full">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No question selected.</div>
            )}

            {/* Bottom Controls: Previous / Next & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {/* Live Answer Status Indicator */}
              <div className="text-xs font-semibold py-1">
                {(selectedAnswers[currentQuestion.id] || currentQuestion.selectedOption) ? (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Question {currentIndex + 1}: Option {selectedAnswers[currentQuestion.id] || currentQuestion.selectedOption} Saved
                    {savingAnswer && <Loader2 className="w-3 h-3 text-emerald-600 animate-spin ml-1" />}
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Question {currentIndex + 1}: Not answered yet
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Submit Interview <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigation Palette (1 col) */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Question Navigation</h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{answeredCount} of {questions.length} Answered</span>
                  <span className="font-bold text-violet-700">{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-[10px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-violet-600 inline-block" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-400 inline-block" />
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-gray-100 border border-gray-300 inline-block" />
                  <span>Empty</span>
                </div>
              </div>

              {/* Question Grid Buttons */}
              <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = isQuestionAnswered(q);
                  const isMarked = q.markedForReview;

                  let btnStyle = 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
                  if (isMarked) {
                    btnStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                  } else if (isAnswered) {
                    btnStyle = 'bg-violet-600 text-white border-violet-600 font-bold';
                  }

                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-violet-500 ring-offset-2';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl border text-xs font-semibold transition-all inline-flex items-center justify-center gap-1 ${btnStyle}`}
                      title={`Question ${idx + 1}${isAnswered ? ' (Answered)' : ' (Unanswered)'}`}
                    >
                      <span>{idx + 1}</span>
                      {isAnswered && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Submit button on palette */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={submittingRound}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingRound ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit MCQ Round <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Submit MCQ Assessment?
            </h3>
            
            <p className="text-xs text-gray-600 text-center mb-6">
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              {unansweredCount > 0 && (
                <span className="block mt-1 text-amber-600 font-semibold">
                  ⚠️ {unansweredCount} questions are still unanswered.
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Keep Answering
              </button>
              <button
                type="button"
                onClick={handleSubmitInterview}
                disabled={submittingRound}
                className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
