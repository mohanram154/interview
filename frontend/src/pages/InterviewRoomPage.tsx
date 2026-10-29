import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Interview, InterviewQuestion, AnswerResponse } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  X
} from 'lucide-react';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Text/Voice mode answer state
  const [answerText, setAnswerText] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmation dialog for submission
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Speech Synthesis (Audio Read-Aloud)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Speech Recognition (Voice Mode)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Real-time evaluation feedback for Text/Voice modes
  const [lastEvaluation, setLastEvaluation] = useState<any | null>(null);

  // 1. Fetch interview details and questions
  const fetchInterview = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.get<ApiResponse<Interview>>(`/interviews/${id}`);
      if (res.data.success && res.data.data) {
        const interviewData = res.data.data;
        setInterview(interviewData);

        if (interviewData.status === 'COMPLETED') {
          navigate(`/interview/${id}/report`);
          return;
        }

        const qs = interviewData.questions || [];
        setQuestions(qs);

        // For non-MCQ, set first unanswered question
        if (interviewData.mode !== 'MCQ') {
          const firstUnansweredIndex = qs.findIndex(q => !q.answered);
          if (firstUnansweredIndex !== -1) {
            setCurrentIndex(firstUnansweredIndex);
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading interview session:', err);
      setError(err.response?.data?.message || 'Failed to load interview session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterview();

    return () => {
      if (hasSpeechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [id]);

  // Sync answerText when navigating questions in Text/Voice mode
  useEffect(() => {
    if (questions[currentIndex]?.answer?.answerText) {
      setAnswerText(questions[currentIndex].answer?.answerText || '');
    } else {
      setAnswerText('');
    }
  }, [currentIndex, questions]);

  // 2. Setup Speech Recognition for Voice Mode
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setAnswerText(prev => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + transcript.trim();
          });
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    } catch (e) {
      setSpeechSupported(false);
    }
  }, []);

  // 3. Speech Synthesis (Read Question Aloud)
  const toggleSpeechSynthesis = (text: string) => {
    if (!hasSpeechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 4. Toggle Voice Recording
  const toggleVoiceRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your answer directly in the text editor.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  // 5. Select MCQ Option and immediately save to backend
  const handleSelectOption = async (optionKey: 'A' | 'B' | 'C' | 'D') => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    // Optimistic UI update
    const updated = [...questions];
    updated[currentIndex] = {
      ...currentQ,
      selectedOption: optionKey,
      answered: true,
      answer: {
        ...(currentQ.answer || ({} as any)),
        interviewQuestionId: currentQ.id,
        selectedOption: optionKey,
        answerText: `Option ${optionKey}`,
        answerStatus: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
      }
    };
    setQuestions(updated);

    try {
      await apiClient.post<ApiResponse<AnswerResponse>>(
        `/interviews/${id}/answers`,
        {
          interviewQuestionId: currentQ.id,
          selectedOption: optionKey,
          markedForReview: currentQ.markedForReview || false,
        }
      );
    } catch (err: any) {
      console.error('Error saving answer selection:', err);
    }
  };

  // 6. Toggle Mark for Review
  const handleToggleMarkForReview = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const newMarked = !currentQ.markedForReview;

    // Optimistic UI update
    const updated = [...questions];
    updated[currentIndex] = {
      ...currentQ,
      markedForReview: newMarked,
    };
    setQuestions(updated);

    try {
      await apiClient.put(`/interviews/${id}/questions/${currentQ.id}/review?marked=${newMarked}`);
    } catch (err: any) {
      console.error('Error toggling mark for review:', err);
    }
  };

  // 7. Submit Text/Voice Answer
  const handleSubmitTextAnswer = async () => {
    if (!answerText.trim()) {
      setError('Please provide an answer before submitting.');
      return;
    }

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (isSpeaking && hasSpeechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post<ApiResponse<AnswerResponse>>(
        `/interviews/${id}/answers`,
        {
          interviewQuestionId: currentQuestion.id,
          answerText: answerText.trim(),
        }
      );

      if (res.data.success && res.data.data) {
        const savedAnswer = res.data.data;
        setLastEvaluation(savedAnswer.evaluation);

        const updatedQuestions = [...questions];
        updatedQuestions[currentIndex] = {
          ...currentQuestion,
          answered: true,
          answer: savedAnswer,
        };
        setQuestions(updatedQuestions);
        setAnswerText('');

        if (currentIndex + 1 < questions.length) {
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
            setLastEvaluation(null);
          }, 2500);
        } else {
          setTimeout(() => {
            handleFinalSubmit();
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Final Submit & Report Generation
  const handleFinalSubmit = async () => {
    setCompleting(true);
    setShowConfirmModal(false);
    try {
      const res = await apiClient.post<ApiResponse<any>>(`/interviews/${id}/complete`);
      if (res.data.success) {
        navigate(`/interview/${id}/report`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete interview and generate report.');
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 bg-white">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <span className="text-sm text-gray-500">Loading interview room...</span>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 text-center px-4 bg-white">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center shadow-sm">
          <Sparkles className="w-8 h-8 text-violet-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Calculating Objective Scores & Explanations...</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Evaluating answers, compiling topic strengths, and generating your detailed technical report.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isMcq = interview?.mode === 'MCQ' || currentQuestion?.questionType === 'MCQ';
  const totalQuestions = questions.length;
  const answeredCount = questions.filter(q => q.answered || (q.selectedOption && q.selectedOption.trim().length > 0)).length;
  const markedCount = questions.filter(q => q.markedForReview).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 bg-white min-h-[calc(100vh-8rem)]">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-gray-900">{interview?.jobRoleName}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700 border border-violet-200">
              {interview?.difficulty}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-800 border border-violet-300">
              {interview?.mode} Round
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium">
            Question {currentIndex + 1} of {totalQuestions} • Domain: {currentQuestion?.category || 'Technical'}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to pause and exit? You can resume this session anytime from your dashboard.')) {
                navigate('/dashboard');
              }
            }}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Save & Exit
          </button>

          {isMcq && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-xl shadow-xs shadow-violet-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Submit Interview</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-gray-600">
          <span>Overall Progress ({answeredCount}/{totalQuestions} Answered)</span>
          <span className="text-violet-700 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-violet-600 transition-all duration-300 rounded-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Question Area (left) + Question Navigation Palette (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Active Question Workspace */}
        <div className="lg:col-span-3 space-y-6">
          {currentQuestion && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {currentQuestion.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mark for Review Button */}
                  {isMcq && (
                    <button
                      type="button"
                      onClick={handleToggleMarkForReview}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        currentQuestion.markedForReview
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {currentQuestion.markedForReview ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 text-amber-600" />
                          <span>Marked for Review</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4 text-gray-400" />
                          <span>Mark for Review</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Read Aloud Button */}
                  {hasSpeechSynthesis && (
                    <button
                      onClick={() => toggleSpeechSynthesis(currentQuestion.questionText)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSpeaking
                          ? 'bg-violet-100 text-violet-700 border border-violet-300 animate-pulse'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                      title={isSpeaking ? 'Stop read-aloud' : 'Read question aloud'}
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4 text-violet-600" /> : <Volume2 className="w-4 h-4 text-gray-500" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-relaxed">
                {currentQuestion.questionText}
              </h2>

              {/* MCQ Options Rendering */}
              {isMcq && (
                <div className="space-y-3 pt-2">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const optText = 
                      optKey === 'A' ? currentQuestion.optionA :
                      optKey === 'B' ? currentQuestion.optionB :
                      optKey === 'C' ? currentQuestion.optionC :
                      currentQuestion.optionD;

                    if (!optText) return null;

                    const isSelected = currentQuestion.selectedOption === optKey;

                    return (
                      <button
                        type="button"
                        key={optKey}
                        onClick={() => handleSelectOption(optKey)}
                        className={`w-full p-4 rounded-xl text-left border flex items-center gap-4 transition-all ${
                          isSelected
                            ? 'bg-violet-50 border-violet-600 text-gray-900 shadow-xs ring-2 ring-violet-600/30'
                            : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300 hover:bg-gray-50/70'
                        }`}
                      >
                        {/* Option Letter Circle */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : 'bg-violet-100 text-violet-700'
                        }`}>
                          {optKey}
                        </div>

                        {/* Option Text */}
                        <div className="text-sm font-medium flex-1 leading-snug">
                          {optText}
                        </div>

                        {/* Check Indicator */}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Non-MCQ: Text or Voice Workspace */}
              {!isMcq && (
                <div className="space-y-4 pt-2">
                  {interview?.mode === 'VOICE' && (
                    <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleVoiceRecording}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all ${
                            isListening
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-violet-600 hover:bg-violet-700 text-white'
                          }`}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="w-4 h-4" />
                              <span>Stop Microphone</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4" />
                              <span>Start Speaking</span>
                            </>
                          )}
                        </button>
                        {isListening && (
                          <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Listening & transcribing...</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Speech recognized is editable below before submitting.
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={6}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={submitting}
                    placeholder="Type your structured technical explanation here..."
                    className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 leading-relaxed transition-all resize-y"
                  />

                  {lastEvaluation && (
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-800 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>AI Evaluation Score: {lastEvaluation.overallScore}/100</span>
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{lastEvaluation.feedback}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitTextAnswer}
                      disabled={submitting || !answerText.trim()}
                      className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Evaluating...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Answer</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Navigation Controls (Previous / Next) */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-gray-500 font-medium">
                  {currentQuestion.selectedOption ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Option {currentQuestion.selectedOption} Saved
                    </span>
                  ) : (
                    <span>Not answered yet</span>
                  )}
                </div>

                {currentIndex + 1 < totalQuestions ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>Finish Interview</span>
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Navigation Palette */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Question Palette</h3>
              <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = q.answered || (q.selectedOption && q.selectedOption.trim().length > 0);
                const isMarked = q.markedForReview;

                let btnClass = 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
                if (isAnswered) {
                  btnClass = 'bg-violet-600 text-white border-violet-600 font-bold';
                }
                if (isMarked) {
                  btnClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-1 ring-amber-400';
                }
                if (isCurrent) {
                  btnClass += ' ring-2 ring-violet-600 ring-offset-2';
                }

                return (
                  <button
                    type="button"
                    key={q.id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-10 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all ${btnClass}`}
                    title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}${isMarked ? ' (Marked for Review)' : ''}`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-violet-600 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-white border border-gray-300 shrink-0" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 shrink-0" />
                <span>Marked for Review ({markedCount})</span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Submit & View Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Confirm Final Submission</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to finalize and submit your interview? Once submitted, your answers will be evaluated on the backend and your score and verified explanations will be revealed.
            </p>

            {/* Status Breakdown */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                <div className="text-xl font-bold text-violet-700">{answeredCount}</div>
                <div className="text-[11px] font-medium text-gray-600 mt-0.5">Answered</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xl font-bold text-gray-700">{unansweredCount}</div>
                <div className="text-[11px] font-medium text-gray-600 mt-0.5">Unanswered</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-xl font-bold text-amber-700">{markedCount}</div>
                <div className="text-[11px] font-medium text-gray-600 mt-0.5">For Review</div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>You have <strong>{unansweredCount}</strong> unanswered question(s). Unanswered questions receive 0 marks.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Keep Practicing
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
