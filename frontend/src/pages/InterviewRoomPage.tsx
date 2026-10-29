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
  ArrowRight,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Speech Synthesis (Audio Read-Aloud)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Speech Recognition (Voice Mode)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Real-time evaluation feedback after submission
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

        const qs = interviewData.questions || [];
        setQuestions(qs);

        // Find first unanswered question
        const firstUnansweredIndex = qs.findIndex(q => !q.answered);
        if (firstUnansweredIndex !== -1) {
          setCurrentIndex(firstUnansweredIndex);
        } else if (qs.length > 0 && qs.every(q => q.answered)) {
          // All answered: complete interview
          handleCompleteInterview();
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
      // Cleanup audio playback on unmount
      if (hasSpeechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [id]);

  // 2. Setup Web Speech Recognition
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

      recognition.onstart = () => {
        setIsListening(true);
      };

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

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition not available:', e);
      setSpeechSupported(false);
    }
  }, []);

  // 3. Speech Synthesis (Read Aloud)
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

  // 5. Submit Answer
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      setError('Please provide an answer before submitting.');
      return;
    }

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    // Stop recording and speech synthesis if active
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

        // Update local question state
        const updatedQuestions = [...questions];
        updatedQuestions[currentIndex] = {
          ...currentQuestion,
          answered: true,
          answer: savedAnswer,
        };
        setQuestions(updatedQuestions);
        setAnswerText('');

        // Move to next question or complete
        if (currentIndex + 1 < questions.length) {
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
            setLastEvaluation(null);
          }, 2500); // Allow brief review of feedback
        } else {
          // All questions answered!
          setTimeout(() => {
            handleCompleteInterview();
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Complete Interview & Generate Report
  const handleCompleteInterview = async () => {
    setCompleting(true);
    try {
      const res = await apiClient.post<ApiResponse<any>>(`/interviews/${id}/complete`);
      if (res.data.success) {
        navigate(`/interview/${id}/report`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to finalize interview report.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading mock interview room...</span>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-sky-400 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-white">Synthesizing Comprehensive Competency Report...</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Calculating 4D evaluation rubrics, text sentiment indicators, and personalized practice recommendations.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + (currentQuestion?.answered ? 1 : 0)) / questions.length) * 100) : 0;
  const isVoiceMode = interview?.mode === 'VOICE';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">{interview?.jobRoleName}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {interview?.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {interview?.mode} MODE
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Question {currentIndex + 1} of {questions.length} • Category: {currentQuestion?.category}
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to exit? You can resume this session anytime from your dashboard.')) {
              navigate('/dashboard');
            }
          }}
          className="text-xs font-medium text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
        >
          Exit Session
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Interview Progress</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-800/60 border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <span className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                Q{currentIndex + 1}
              </span>
              <span>{currentQuestion.category}</span>
            </div>

            {/* Read Aloud Button */}
            {hasSpeechSynthesis && (
              <button
                onClick={() => toggleSpeechSynthesis(currentQuestion.questionText)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSpeaking
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600'
                }`}
                title={isSpeaking ? 'Stop read-aloud' : 'Read question aloud'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
              </button>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
            {currentQuestion.questionText}
          </h3>
        </div>
      )}

      {/* Answer Workspace */}
      <div className="space-y-4">
        {/* Voice Controls Bar if Voice Mode */}
        {isVoiceMode && (
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
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
                <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Listening & transcribing...</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              Transcript is editable below before submitting.
            </div>
          </div>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={7}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            disabled={submitting}
            placeholder={
              isVoiceMode
                ? "Click 'Start Speaking' above to speak your answer, or type directly here. You can refine your answer before submission."
                : "Type your structured technical explanation here. Include key concepts, APIs, and architectural trade-offs..."
            }
            className="w-full p-4 bg-slate-800/70 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 leading-relaxed transition-all resize-y"
          />

          <div className="flex justify-between items-center text-xs text-slate-400 mt-2 px-1">
            <span>
              {answerText.trim() ? `${answerText.trim().split(/\s+/).length} words` : '0 words'} •{' '}
              {answerText.length} characters
            </span>
            <span>Focus on technical accuracy & clarity</span>
          </div>
        </div>

        {/* Real-time Answer Feedback Card if just submitted */}
        {lastEvaluation && (
          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AI Evaluation: {lastEvaluation.overallScore}/100</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Technical: {lastEvaluation.technicalAccuracyScore}/100 • Clarity: {lastEvaluation.clarityScore}/100
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {lastEvaluation.feedback}
            </p>
            <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
              Next question loading automatically...
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <span>Answers saved persistently to MySQL.</span>
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={submitting || !answerText.trim()}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Answer...</span>
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
    </div>
  );
};
