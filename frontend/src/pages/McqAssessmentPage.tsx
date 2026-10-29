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
  Award
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
  const [error, setError] = useState<string | null>(null);

  // Audio synthesis
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Initialize or fetch existing MCQ interview
  const initMcqRound = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start or resume MCQ interview via assessment endpoint
      const interviewResp = await assessmentApi.startOrResumeMcqRound(session.id);
      setInterview(interviewResp);

      // Fetch fresh question list
      const qsRes = await apiClient.get<ApiResponse<InterviewQuestion[]>>(`/interviews/${interviewResp.id}/questions`);
      if (qsRes.data.success) {
        const qs = qsRes.data.data;
        setQuestions(qs);

        // Map any already submitted answers
        const ansMap: Record<number, string> = {};
        qs.forEach(q => {
          if (q.answered && q.answer?.selectedOption) {
            ansMap[q.id] = q.answer.selectedOption.toUpperCase();
          }
        });
        setSelectedAnswers(ansMap);
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
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }));

    try {
      setSavingAnswer(true);
      const res = await apiClient.post<ApiResponse<any>>(`/interviews/${interview.id}/answers`, {
        interviewQuestionId: currentQuestion.id,
        selectedOption: opt,
        answerText: `Selected option: ${opt}`
      });

      if (res.data.success) {
        // Update local question state
        setQuestions(prev => prev.map(q => {
          if (q.id === currentQuestion.id) {
            return {
              ...q,
              answered: true,
              answer: res.data.data
            };
          }
          return q;
        }));
      }
    } catch (err) {
      console.error('Failed to save answer option:', err);
    } finally {
      setSavingAnswer(false);
    }
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

      // 1. Complete interview on backend
      const reportRes = await apiClient.post<ApiResponse<any>>(`/interviews/${interview.id}/complete`);
      const score = reportRes.data.data?.overallScore || 0;

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

  const answeredCount = questions.filter(q => q.answered).length;
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
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
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
                    {currentQuestion.category && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
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
                    const isSelected = selectedAnswers[currentQuestion.id] === key;

                    return (
                      <div
                        key={key}
                        onClick={() => handleSelectOption(key)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/60 shadow-xs ring-2 ring-violet-500/20'
                            : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50/50 bg-white'
                        }`}
                      >
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
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No question selected.</div>
            )}

            {/* Bottom Controls: Previous / Next & Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-colors disabled:opacity-40 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-3">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-2"
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
                  const isAnswered = q.answered || Boolean(selectedAnswers[q.id]);
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
                      className={`h-9 rounded-xl border text-xs font-semibold transition-all ${btnStyle}`}
                    >
                      {idx + 1}
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
