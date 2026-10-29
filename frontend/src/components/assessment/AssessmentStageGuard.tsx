import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../../api/assessmentApi';
import { AssessmentSession, AssessmentStage } from '../../types/assessment';
import { Lock, ArrowLeft, ShieldAlert, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { AssessmentStageStepper } from './AssessmentStageStepper';

interface AssessmentStageGuardProps {
  requiredStage: AssessmentStage | 'FINAL_REPORT';
  children: (props: { session: AssessmentSession; reloadSession: () => Promise<void> }) => React.ReactNode;
}

export const AssessmentStageGuard: React.FC<AssessmentStageGuardProps> = ({
  requiredStage,
  children
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSession = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await assessmentApi.getSession(id);
      setSession(data);
    } catch (err: any) {
      console.error('Failed to load assessment session:', err);
      const msg = err.response?.data?.message || 'Failed to load assessment session.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id, requiredStage]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium text-sm">Verifying assessment round permissions...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Error</h2>
        <p className="text-gray-600 mb-6">{errorMsg || 'Assessment session could not be found or you do not have permission.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Check stage unlock status
  let isUnlocked = false;
  let lockMessage = '';
  let roundTitle = '';
  let roundProgress = '';

  switch (requiredStage) {
    case 'RESUME_EVALUATION':
      isUnlocked = session.resumeUnlocked;
      roundTitle = 'Resume Evaluation';
      roundProgress = 'Round 1 of 3';
      lockMessage = 'This round is available.';
      break;

    case 'MCQ_ASSESSMENT':
      isUnlocked = session.mcqUnlocked;
      roundTitle = 'MCQ Technical Assessment';
      roundProgress = 'Round 2 of 3';
      lockMessage = 'Complete Resume Evaluation to unlock this round.';
      break;

    case 'VIDEO_INTERVIEW':
      isUnlocked = session.videoUnlocked;
      roundTitle = 'AI Video Interview';
      roundProgress = 'Round 3 of 3';
      lockMessage = 'Complete MCQ Assessment to unlock this round.';
      break;

    case 'FINAL_REPORT':
    case 'COMPLETED':
      isUnlocked = session.finalReportUnlocked;
      roundTitle = 'Final Combined Assessment Report';
      roundProgress = 'All 3 Rounds';
      lockMessage = 'Complete all three assessment rounds to unlock the final report.';
      break;
  }

  // If locked, render the dedicated White-and-Violet Locked Round View
  if (!isUnlocked) {
    return (
      <div className="max-w-3xl mx-auto my-8 px-4">
        {/* Stepper navigation */}
        <div className="mb-6">
          <AssessmentStageStepper
            session={session}
            activeStage={requiredStage as any}
            onNavigateStage={(stg) => {
              if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stg === 'MCQ_ASSESSMENT' && session.mcqUnlocked) navigate(`/assessment/${session.id}/mcq`);
              else if (stg === 'VIDEO_INTERVIEW' && session.videoUnlocked) navigate(`/assessment/${session.id}/video`);
              else if (stg === 'FINAL_REPORT' && session.finalReportUnlocked) navigate(`/assessment/${session.id}/report`);
              else navigate(`/assessment/${session.id}`);
            }}
          />
        </div>

        {/* Locked Card */}
        <div className="bg-white border-2 border-dashed border-violet-200 rounded-3xl p-8 sm:p-10 shadow-xs text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-full -z-0 opacity-60" />
          
          <div className="relative z-10 max-w-lg mx-auto">
            {/* Lock Icon */}
            <div className="w-20 h-20 rounded-3xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center mx-auto mb-5 text-violet-700 shadow-inner">
              <Lock className="w-10 h-10" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 mb-3 border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Round Status: Locked • {roundProgress}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{roundTitle} is Locked</h2>
            
            {/* Exact Required Lock Message */}
            <div className="my-5 p-4 bg-violet-50/70 border border-violet-200 rounded-2xl">
              <p className="text-sm font-semibold text-violet-900 leading-relaxed">
                "{lockMessage}"
              </p>
            </div>

            <p className="text-xs text-gray-500 mb-8 leading-relaxed">
              InterviewVerse strictly enforces sequential assessment. Prerequisite rounds must be submitted and scored before subsequent stages can be unlocked.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/assessment/${session.id}`)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Assessment Hub
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!session.resumeUnlocked || session.resumeStageStatus !== 'COMPLETED') {
                    navigate(`/assessment/${session.id}/resume`);
                  } else if (!session.mcqUnlocked || session.mcqStageStatus !== 'COMPLETED') {
                    navigate(`/assessment/${session.id}/mcq`);
                  } else {
                    navigate(`/assessment/${session.id}`);
                  }
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                Go to Current Accessible Round <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Round is unlocked: render child components
  return <>{children({ session, reloadSession: fetchSession })}</>;
};

