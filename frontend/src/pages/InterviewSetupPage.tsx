import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { assessmentApi } from '../api/assessmentApi';
import { JobRole } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
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

  const [loading, setLoading] = useState(true);
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
        difficulty: 'INTERMEDIATE',
        questionCount: 20
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
          <span>Assessment Configurator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Start Technical Assessment</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Select your target technical domain to begin the sequential 3-round evaluation pipeline.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Technical Domain / Role Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-900">
          Select Target Technical Domain / Role
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

      {/* Summary Box & Action */}
      <div className="p-6 sm:p-8 rounded-3xl bg-violet-50/70 border border-violet-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full">
              Assessment Pipeline
            </span>
            <span className="text-xs font-semibold text-gray-500">
              Strict Sequential Evaluation
            </span>
          </div>
          <div className="text-base font-bold text-gray-900 mt-1">
            {selectedRole?.name || 'Please select a technical role'}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            Round 1: Resume Evaluation → Round 2: 20-Question MCQ → Round 3: AI Video Interview → Final Report
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartAssessmentPipeline}
          disabled={startingAssessment || !selectedRoleId}
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
  );
};
