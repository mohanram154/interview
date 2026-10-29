import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { JobRole, CreateInterviewPayload, Interview } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
  PlayCircle, 
  Mic, 
  FileText, 
  Zap, 
  HelpCircle, 
  Loader2, 
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';

export const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string>('INTERMEDIATE');
  const [mode, setMode] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading interview environments...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Session Configurator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Setup Mock Interview</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Configure your technical domain, difficulty tier, and preferred interaction mode.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Job Role Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200">
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
                    ? 'bg-sky-500/10 border-sky-500 text-white shadow-md shadow-sky-500/10'
                    : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-sm mb-1">{role.name}</div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {role.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Difficulty Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200">
          2. Select Difficulty Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'BEGINNER', label: 'Beginner', desc: 'Core fundamentals & definitions' },
            { id: 'INTERMEDIATE', label: 'Intermediate', desc: 'Architecture, trade-offs & APIs' },
            { id: 'ADVANCED', label: 'Advanced', desc: 'Concurrency, internals & scalability' },
          ].map((d) => (
            <button
              type="button"
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`p-4 rounded-xl text-left border transition-all ${
                difficulty === d.id
                  ? 'bg-sky-500/10 border-sky-500 text-white shadow-sm'
                  : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-sm mb-0.5">{d.label}</div>
              <div className="text-[11px] text-slate-400">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Mode Selection (Voice vs Text) */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200">
          3. Select Interview Interaction Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('TEXT')}
            className={`p-4 rounded-xl text-left border flex items-start gap-3.5 transition-all ${
              mode === 'TEXT'
                ? 'bg-sky-500/10 border-sky-500 text-white shadow-sm'
                : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${mode === 'TEXT' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-700 text-slate-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Text Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Classic typing interface. Ideal for drafting structured algorithms and detailed code explanations.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('VOICE')}
            className={`p-4 rounded-xl text-left border flex items-start gap-3.5 transition-all ${
              mode === 'VOICE'
                ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${mode === 'VOICE' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Voice Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Browser Speech Synthesis reads questions aloud; microphone speech recognition transcribes answers with live editable fallback.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Question Count */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-slate-200">
            4. Number of Questions
          </label>
          <span className="text-xs font-bold text-sky-400">{questionCount} Questions</span>
        </div>
        <div className="flex gap-3">
          {[3, 5, 7].map((num) => (
            <button
              type="button"
              key={num}
              onClick={() => setQuestionCount(num)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                questionCount === num
                  ? 'bg-sky-500 text-white border-sky-400'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {num} Questions
            </button>
          ))}
        </div>
      </div>

      {/* Summary Box & Start Action */}
      <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Ready to begin:</div>
          <div className="text-sm font-semibold text-white">
            {selectedRole?.name} • {difficulty} Level • {mode} Mode ({questionCount} Questions)
          </div>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={starting}
          className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Session...</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              <span>Launch Mock Interview</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
