import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { assessmentApi } from '../api/assessmentApi';
import { JobRole, CreateInterviewPayload, Interview } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
  PlayCircle, 
  HelpCircle, 
  Mic, 
  FileText, 
  Loader2, 
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string>('INTERMEDIATE');
  const [mode, setMode] = useState<'MCQ' | 'TEXT' | 'VOICE'>('MCQ');
  const [questionCount, setQuestionCount] = useState<number>(20);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startingAssessment, setStartingAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartAssessmentPipeline = async () => {
    if (!selectedRoleId) {
      setError('Please select a technical domain / role.');
      return;
    }

    setStartingAssessment(true);
    setError(null);

    try {
      const res = await assessmentApi.createSession({
        jobRoleId: selectedRoleId,
        difficulty
      });
      navigate(`/assessment/${res.id}`);
    } catch (err: any) {
      console.error('Failed to create assessment session:', err);
      setError(err.response?.data?.message || 'Failed to initialize assessment session.');
    } finally {
      setStartingAssessment(false);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<ApiResponse<JobRole[]>>('/job-roles');
        if (res.data.success && res.data.data.length > 0) {
          setJobRoles(res.data.data);
          const stateRoleId = (location.state as any)?.selectedRoleId;
          if (stateRoleId && res.data.data.some(r => r.id === stateRoleId)) {
            setSelectedRoleId(stateRoleId);
          } else {
            setSelectedRoleId(res.data.data[0].id);
          }
        }
      } catch (err: any) {
        setError('Failed to fetch available technical roles from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [location.state]);

  // Adjust question count when switching modes
  const handleModeChange = (newMode: 'MCQ' | 'TEXT' | 'VOICE') => {
    setMode(newMode);
    if (newMode === 'MCQ') {
      setQuestionCount(20);
    } else {
      setQuestionCount(5);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedRoleId) {
      setError('Please select a job role.');
      return;
    }

    setStarting(true);
    setError(null);

    const payload: CreateInterviewPayload = {
      jobRoleId: selectedRoleId,
      difficulty,
      mode,
      questionCount
    };

    try {
      const res = await apiClient.post<ApiResponse<Interview>>('/interviews', payload);
      if (res.data.success && res.data.data) {
        navigate(`/interview/${res.data.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create interview session.');
    } finally {
      setStarting(false);
    }
  };

  const selectedRole = jobRoles.find(r => r.id === selectedRoleId);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-white">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <span className="text-sm text-gray-500">Loading interview environments...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 bg-white">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>Session Configurator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Setup Technical Interview</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Configure your technical domain, difficulty tier, and interview round format.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Job Role Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-900">
          1. Select Technical Domain / Role
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {jobRoles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            return (
              <button
                type="button"
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-violet-50 border-violet-600 text-gray-900 shadow-sm ring-1 ring-violet-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-900">{role.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
                </div>
                <div className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {role.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Difficulty Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-900">
          2. Select Difficulty Level
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'BEGINNER', label: 'Beginner', desc: 'Core fundamentals, keywords & syntax' },
            { id: 'INTERMEDIATE', label: 'Intermediate', desc: 'Architecture, APIs, trade-offs & design' },
            { id: 'ADVANCED', label: 'Advanced', desc: 'Concurrency, internals, optimization & scale' },
          ].map((d) => {
            const isSelected = difficulty === d.id;
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-violet-50 border-violet-600 text-gray-900 shadow-sm ring-1 ring-violet-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm text-gray-900">{d.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
                </div>
                <div className="text-[11px] text-gray-500">{d.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Interview Mode Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-900">
          3. Select Interview Round Mode
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* MCQ Option */}
          <button
            type="button"
            onClick={() => handleModeChange('MCQ')}
            className={`p-4 rounded-xl text-left border flex flex-col justify-between transition-all ${
              mode === 'MCQ'
                ? 'bg-violet-50 border-violet-600 shadow-sm ring-1 ring-violet-600'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${mode === 'MCQ' ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-600'}`}>
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200">
                  Default Round
                </span>
              </div>
              <div className="font-semibold text-sm text-gray-900 mb-1">MCQ Round</div>
              <div className="text-[11px] text-gray-500 leading-relaxed">
                15–20 multiple-choice questions with 4 options, question navigation, mark-for-review & instant scoring.
              </div>
            </div>
            {mode === 'MCQ' && (
              <div className="mt-3 text-[11px] font-semibold text-violet-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
                <span>Selected</span>
              </div>
            )}
          </button>

          {/* Text Option */}
          <button
            type="button"
            onClick={() => handleModeChange('TEXT')}
            className={`p-4 rounded-xl text-left border flex flex-col justify-between transition-all ${
              mode === 'TEXT'
                ? 'bg-violet-50 border-violet-600 shadow-sm ring-1 ring-violet-600'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${mode === 'TEXT' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-400">Written</span>
              </div>
              <div className="font-semibold text-sm text-gray-900 mb-1">Text Interview</div>
              <div className="text-[11px] text-gray-500 leading-relaxed">
                Written subjective answers evaluated with the Python NLP engine for accuracy, relevance & clarity.
              </div>
            </div>
            {mode === 'TEXT' && (
              <div className="mt-3 text-[11px] font-semibold text-violet-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
                <span>Selected</span>
              </div>
            )}
          </button>

          {/* Voice Option */}
          <button
            type="button"
            onClick={() => handleModeChange('VOICE')}
            className={`p-4 rounded-xl text-left border flex flex-col justify-between transition-all ${
              mode === 'VOICE'
                ? 'bg-violet-50 border-violet-600 shadow-sm ring-1 ring-violet-600'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${mode === 'VOICE' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-400">Interactive</span>
              </div>
              <div className="font-semibold text-sm text-gray-900 mb-1">Voice Interview</div>
              <div className="text-[11px] text-gray-500 leading-relaxed">
                Browser Speech Synthesis reads questions aloud; microphone recognition transcribes spoken answers.
              </div>
            </div>
            {mode === 'VOICE' && (
              <div className="mt-3 text-[11px] font-semibold text-violet-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
                <span>Selected</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 4. Question Count Selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-bold text-gray-900">
            4. Number of Questions per Session
          </label>
          <span className="text-xs font-bold text-violet-600 px-2 py-0.5 rounded bg-violet-100">
            {questionCount} Questions Selected
          </span>
        </div>

        {mode === 'MCQ' ? (
          <div className="grid grid-cols-2 gap-3">
            {[20, 15].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setQuestionCount(num)}
                className={`py-3 px-4 rounded-xl text-sm font-semibold border flex items-center justify-between transition-all ${
                  questionCount === num
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{num} Multiple Choice Questions</span>
                {num === 20 && (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    questionCount === 20 ? 'bg-violet-800 text-violet-100' : 'bg-violet-100 text-violet-700'
                  }`}>
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[5, 10].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setQuestionCount(num)}
                className={`py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                  questionCount === num
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {num} Questions
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Box & Action */}
      <div className="p-6 sm:p-8 rounded-3xl bg-violet-50/70 border border-violet-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
              Assessment Pipeline
            </span>
            <span className="text-xs font-semibold text-gray-500">
              Strict Sequential Evaluation
            </span>
          </div>
          <div className="text-base font-bold text-gray-900 mt-1">
            {selectedRole?.name} • {difficulty} Level
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            Round 1: Resume Evaluation → Round 2: 20-Question MCQ → Round 3: AI Video Interview → Final Report
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleStartInterview}
            disabled={starting || startingAssessment}
            className="px-5 py-3 rounded-2xl font-semibold text-xs text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {starting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Launching Practice...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 text-gray-500" />
                <span>Practice Single Round</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleStartAssessmentPipeline}
            disabled={starting || startingAssessment}
            className="px-7 py-3 rounded-2xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {startingAssessment ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing Pipeline...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Start Sequential Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
