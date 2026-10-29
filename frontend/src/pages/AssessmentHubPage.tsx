import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../api/assessmentApi';
import { AssessmentSession, StageStatus } from '../types/assessment';
import { AssessmentStageStepper } from '../components/assessment/AssessmentStageStepper';
import { 
  FileText, 
  HelpCircle, 
  Video, 
  Award, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Briefcase, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const AssessmentHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSession = async (isManualRefresh = false) => {
    if (!id) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);
      const data = await assessmentApi.getSession(id);
      setSession(data);
    } catch (err: any) {
      console.error('Failed to load assessment session:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to retrieve assessment session details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Loading Assessment Session</h2>
        <p className="text-sm text-gray-500 mt-1">Retrieving verified round progression from database...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white border border-rose-200 rounded-3xl p-8 shadow-xs text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment Not Accessible</h2>
          <p className="text-sm text-gray-600 mb-6">{errorMsg || 'Unable to load assessment session.'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => loadSession(true)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Retry
            </button>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format Helper for Status Badges
  const renderStatusBadge = (status: StageStatus, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          <Lock className="w-3.5 h-3.5" /> Locked
        </span>
      );
    }
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'AVAILABLE':
      case 'NOT_STARTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            <Sparkles className="w-3.5 h-3.5" /> Available
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner & Session Meta */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-600" /> Assessment Pipeline
                </span>
                <span className="text-xs font-bold text-gray-500">
                  ID: #{session.id}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-semibold text-violet-900 bg-violet-100/60 px-2.5 py-0.5 rounded-md">
                  {session.difficulty} Difficulty
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {session.jobRoleName} Technical Evaluation
              </h1>
              
              <p className="text-sm text-gray-600 mt-1">
                Strict sequential 3-stage candidate evaluation. Each round unlocks automatically upon successful completion.
              </p>
            </div>

            {/* Header Right: Active Round Indicator & Refresh */}
            <div className="flex items-center gap-3">
              <div className="bg-violet-50 border border-violet-200 px-4 py-2.5 rounded-2xl text-right">
                <div className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
                  Active Status
                </div>
                <div className="text-sm font-bold text-violet-950">
                  {session.progressText || (
                    session.currentStage === 'COMPLETED' ? 'All 3 Rounds Completed' :
                    session.currentStage === 'VIDEO_INTERVIEW' ? 'Round 3 of 3: AI Video Interview' :
                    session.currentStage === 'MCQ_ASSESSMENT' ? 'Round 2 of 3: MCQ Technical Assessment' :
                    'Round 1 of 3: Resume Evaluation'
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadSession(true)}
                disabled={refreshing}
                title="Refresh Assessment Status from Database"
                className="p-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-violet-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-violet-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Stepper */}
        <div className="mb-8">
          <AssessmentStageStepper
            session={session}
            activeStage={session.currentStage as any}
            onNavigateStage={(stage) => {
              if (stage === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stage === 'MCQ_ASSESSMENT' && session.mcqUnlocked) navigate(`/assessment/${session.id}/mcq`);
              else if (stage === 'VIDEO_INTERVIEW' && session.videoUnlocked) navigate(`/assessment/${session.id}/video`);
              else if (stage === 'FINAL_REPORT' && session.finalReportUnlocked) navigate(`/assessment/${session.id}/report`);
            }}
          />
        </div>

        {/* 3 Sequential Round Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* ================= ROUND 1: RESUME EVALUATION ================= */}
          <div className={`flex flex-col bg-white rounded-3xl border transition-all duration-200 shadow-xs relative overflow-hidden ${
            session.resumeStageStatus === 'COMPLETED'
              ? 'border-emerald-200 ring-1 ring-emerald-100'
              : 'border-violet-200 ring-2 ring-violet-500/10'
          }`}>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Round 1 of 3
                </span>
                {renderStatusBadge(session.resumeStageStatus, session.resumeUnlocked)}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Resume Evaluation</h3>
                  <p className="text-xs text-gray-500">Domain & Experience Alignment</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Upload and evaluate candidate resume against <strong>{session.jobRoleName}</strong> benchmarks, extracting core technical proficiencies, skills match, and project depth.
              </p>

              {/* Status Details / Scores */}
              <div className="mt-auto bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Round Status:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {session.resumeStageStatus === 'COMPLETED' ? 'Completed' :
                     session.resumeStageStatus === 'IN_PROGRESS' ? 'In Progress' : 'Available'}
                  </span>
                </div>

                {session.resumeScore != null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Resume Score:</span>
                    <span className="font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md">
                      {session.resumeScore}%
                    </span>
                  </div>
                )}

                {session.resumeFilename && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Parsed File:</span>
                    <span className="font-medium text-gray-700 truncate max-w-[150px]">
                      {session.resumeFilename}
                    </span>
                  </div>
                )}

                {session.resumeCompletedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="font-medium text-gray-600">
                      {new Date(session.resumeCompletedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div>
                {session.resumeStageStatus === 'COMPLETED' ? (
                  <Link
                    to={`/assessment/${session.id}/resume`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-sm font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> View Resume Evaluation
                  </Link>
                ) : session.resumeStageStatus === 'IN_PROGRESS' ? (
                  <Link
                    to={`/assessment/${session.id}/resume`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Continue Resume Evaluation <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/assessment/${session.id}/resume`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Start Resume Evaluation <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ================= ROUND 2: MCQ TECHNICAL ASSESSMENT ================= */}
          <div className={`flex flex-col bg-white rounded-3xl border transition-all duration-200 shadow-xs relative overflow-hidden ${
            !session.mcqUnlocked 
              ? 'border-gray-200 bg-gray-50/40 opacity-90'
              : session.mcqStageStatus === 'COMPLETED'
              ? 'border-emerald-200 ring-1 ring-emerald-100'
              : 'border-violet-300 ring-2 ring-violet-500/10'
          }`}>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider ${session.mcqUnlocked ? 'text-violet-600' : 'text-gray-400'}`}>
                  Round 2 of 3
                </span>
                {renderStatusBadge(session.mcqStageStatus, session.mcqUnlocked)}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  session.mcqUnlocked 
                    ? 'bg-violet-50 text-violet-700 border border-violet-100'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${session.mcqUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    MCQ Assessment
                  </h3>
                  <p className="text-xs text-gray-500">20 Technical Multiple-Choice Questions</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Standardized 20-question multiple-choice technical round covering core concepts, debugging, code analysis, and domain fundamentals.
              </p>

              {/* Status & Gating Message */}
              <div className="mt-auto mb-6">
                {!session.mcqUnlocked ? (
                  <div className="bg-violet-50/60 border border-violet-200 rounded-2xl p-4 text-center">
                    <Lock className="w-5 h-5 text-violet-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-violet-900 leading-snug">
                      "Complete Resume Evaluation to unlock this round."
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Prerequisite: Round 1 submission & verified score required.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Round Status:</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {session.mcqStageStatus === 'COMPLETED' ? 'Completed' :
                         session.mcqStageStatus === 'IN_PROGRESS' ? 'In Progress' : 'Available'}
                      </span>
                    </div>

                    {session.mcqScore != null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">MCQ Score:</span>
                        <span className="font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md">
                          {session.mcqScore}%
                        </span>
                      </div>
                    )}

                    {session.mcqCompletedAt && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Submitted:</span>
                        <span className="font-medium text-gray-600">
                          {new Date(session.mcqCompletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button: Disabled when locked */}
              <div>
                {!session.mcqUnlocked ? (
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 text-gray-400 border border-gray-200 text-sm font-semibold cursor-not-allowed select-none"
                  >
                    <Lock className="w-4 h-4" /> Locked (Requires Round 1)
                  </button>
                ) : session.mcqStageStatus === 'COMPLETED' ? (
                  <Link
                    to={`/assessment/${session.id}/mcq`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-sm font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Review MCQ Results
                  </Link>
                ) : session.mcqStageStatus === 'IN_PROGRESS' ? (
                  <Link
                    to={`/assessment/${session.id}/mcq`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Continue MCQ Assessment <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/assessment/${session.id}/mcq`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Start MCQ Assessment <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ================= ROUND 3: AI VIDEO INTERVIEW ================= */}
          <div className={`flex flex-col bg-white rounded-3xl border transition-all duration-200 shadow-xs relative overflow-hidden ${
            !session.videoUnlocked 
              ? 'border-gray-200 bg-gray-50/40 opacity-90'
              : session.videoStageStatus === 'COMPLETED'
              ? 'border-emerald-200 ring-1 ring-emerald-100'
              : 'border-violet-300 ring-2 ring-violet-500/10'
          }`}>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider ${session.videoUnlocked ? 'text-violet-600' : 'text-gray-400'}`}>
                  Round 3 of 3
                </span>
                {renderStatusBadge(session.videoStageStatus, session.videoUnlocked)}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  session.videoUnlocked 
                    ? 'bg-violet-50 text-violet-700 border border-violet-100'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${session.videoUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    AI Video Interview
                  </h3>
                  <p className="text-xs text-gray-500">Interactive Technical & Sentiment Analysis</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Interactive real-time interview with automated technical competency assessment, speech clarity scoring, and candidate sentiment analytics.
              </p>

              {/* Status & Gating Message */}
              <div className="mt-auto mb-6">
                {!session.videoUnlocked ? (
                  <div className="bg-violet-50/60 border border-violet-200 rounded-2xl p-4 text-center">
                    <Lock className="w-5 h-5 text-violet-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-violet-900 leading-snug">
                      "Complete MCQ Assessment to unlock this round."
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Prerequisite: Round 2 submission & verified score required.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Round Status:</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {session.videoStageStatus === 'COMPLETED' ? 'Completed' :
                         session.videoStageStatus === 'IN_PROGRESS' ? 'In Progress' : 'Available'}
                      </span>
                    </div>

                    {session.videoScore != null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Video Score:</span>
                        <span className="font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md">
                          {session.videoScore}%
                        </span>
                      </div>
                    )}

                    {session.videoSentimentLabel && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Sentiment:</span>
                        <span className="font-semibold text-emerald-700">
                          {session.videoSentimentLabel}
                        </span>
                      </div>
                    )}

                    {session.videoCompletedAt && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Submitted:</span>
                        <span className="font-medium text-gray-600">
                          {new Date(session.videoCompletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button: Disabled when locked */}
              <div>
                {!session.videoUnlocked ? (
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 text-gray-400 border border-gray-200 text-sm font-semibold cursor-not-allowed select-none"
                  >
                    <Lock className="w-4 h-4" /> Locked (Requires Round 2)
                  </button>
                ) : session.videoStageStatus === 'COMPLETED' ? (
                  <Link
                    to={`/assessment/${session.id}/video`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-sm font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Review Video Interview
                  </Link>
                ) : session.videoStageStatus === 'IN_PROGRESS' ? (
                  <Link
                    to={`/assessment/${session.id}/video`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Continue Video Interview <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/assessment/${session.id}/video`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Start AI Video Interview <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ================= FINAL COMBINED REPORT CARD ================= */}
        <div className={`rounded-3xl p-6 sm:p-8 border transition-all ${
          session.finalReportUnlocked
            ? 'bg-gradient-to-r from-violet-900 to-indigo-900 text-white shadow-lg border-violet-800'
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                session.finalReportUnlocked
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-gray-200/80 text-gray-400 border border-gray-300'
              }`}>
                {session.finalReportUnlocked ? (
                  <Award className="w-7 h-7 text-amber-300" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    session.finalReportUnlocked ? 'text-violet-200' : 'text-gray-500'
                  }`}>
                    Comprehensive Outcome
                  </span>
                  {session.finalReportUnlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Ready to View
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">
                      Locked
                    </span>
                  )}
                </div>

                <h3 className={`text-xl font-bold ${session.finalReportUnlocked ? 'text-white' : 'text-gray-900'}`}>
                  Final Combined Assessment Report
                </h3>

                <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${
                  session.finalReportUnlocked ? 'text-violet-200' : 'text-gray-500'
                }`}>
                  {session.finalReportUnlocked
                    ? `Congratulations! All three assessment stages are completed. Your composite score combines 25% Resume Analysis, 40% MCQ Technical Assessment, and 35% AI Video Interview.`
                    : `"Complete all three assessment rounds to unlock the final report."`}
                </p>
              </div>
            </div>

            {/* Score & Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {session.finalCompositeScore != null && (
                <div className="text-right px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <div className="text-[10px] uppercase font-semibold text-violet-200">
                    Composite Score
                  </div>
                  <div className="text-2xl font-black text-white">
                    {session.finalCompositeScore}%
                  </div>
                </div>
              )}

              {session.finalReportUnlocked ? (
                <Link
                  to={`/assessment/${session.id}/report`}
                  className="px-6 py-3.5 rounded-2xl bg-white text-violet-900 hover:bg-violet-50 font-bold text-sm shadow-md transition-all inline-flex items-center gap-2 hover:scale-[1.02]"
                >
                  <TrendingUp className="w-4 h-4 text-violet-700" /> View Final Combined Report
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-6 py-3.5 rounded-2xl bg-gray-200 text-gray-400 border border-gray-300 font-semibold text-sm cursor-not-allowed select-none inline-flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Final Report Locked
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

