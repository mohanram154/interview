import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../api/assessmentApi';
import { AssessmentSession, AssessmentReport, ReportHistoryItem } from '../types/assessment';
import { AssessmentStageGuard } from '../components/assessment/AssessmentStageGuard';
import { AssessmentStageStepper } from '../components/assessment/AssessmentStageStepper';
import { 
  Award, 
  FileText, 
  HelpCircle, 
  Video, 
  ArrowLeft, 
  CheckCircle2, 
  Printer, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  History,
  Check,
  X,
  Lock,
  Volume2,
  Activity,
  Layers,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  ArrowUpRight,
  Trash2,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

export const FinalReportPage: React.FC = () => {
  return (
    <AssessmentStageGuard requiredStage="FINAL_REPORT">
      {({ session }) => <FinalReportContent session={session} />}
    </AssessmentStageGuard>
  );
};

interface ContentProps {
  session: AssessmentSession;
}

const FinalReportContent: React.FC<ContentProps> = ({ session }) => {
  const navigate = useNavigate();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Accordion states
  const [expandedMcqQuestion, setExpandedMcqQuestion] = useState<number | null>(null);
  const [expandedVideoQuestion, setExpandedVideoQuestion] = useState<number | null>(null);

  // Report History Modal state
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<ReportHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Data Privacy & Recording Deletion states
  const [deletingRecordings, setDeletingRecordings] = useState<boolean>(false);
  const [recordingsDeleted, setRecordingsDeleted] = useState<boolean>(session.recordingsDeletedByUser || false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const handleDeleteRecordings = async () => {
    try {
      setDeletingRecordings(true);
      const res = await assessmentApi.deleteRecordings(session.id);
      setRecordingsDeleted(true);
      setDeleteConfirmOpen(false);
      setDeleteMessage(res.message || 'All recordings have been permanently purged.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete recordings. Please try again.');
    } finally {
      setDeletingRecordings(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [session.id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await assessmentApi.getAssessmentReport(session.id);
      setReport(data);
    } catch (err: any) {
      console.error('Failed to load final report:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to retrieve assessment report.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    try {
      setLoadingHistory(true);
      const list = await assessmentApi.getReportHistory();
      setHistoryItems(list);
    } catch (err) {
      console.error('Failed to load report history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin mb-4" />
        <h3 className="text-base font-bold text-gray-900">Compiling 3-Stage Assessment Report...</h3>
        <p className="text-xs text-gray-500 mt-1">Synthesizing Resume, MCQ, and Video Analytics</p>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Report Retrieval Notice</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{errorMsg || 'Could not load report.'}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={loadReport}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
            >
              Retry
            </button>
            <Link
              to={`/assessment/${session.id}`}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Assessment Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: INCOMPLETE REPORT (One or more rounds pending)
  // =========================================================================
  if (report.status === 'INCOMPLETE') {
    const resumeDone = report.resumeCard?.status === 'COMPLETED';
    const mcqDone = report.mcqCard?.status === 'COMPLETED';
    const videoDone = report.videoCard?.status === 'COMPLETED';

    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to={`/assessment/${session.id}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Assessment Hub
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Assessment Status: Incomplete
            </span>
          </div>

          <AssessmentStageStepper
            session={session}
            activeStage="FINAL_REPORT"
            onNavigateStage={(stg) => {
              if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stg === 'MCQ_ASSESSMENT' && session.mcqUnlocked) navigate(`/assessment/${session.id}/mcq`);
              else if (stg === 'VIDEO_INTERVIEW' && session.videoUnlocked) navigate(`/assessment/${session.id}/video`);
            }}
          />

          {/* Incomplete Banner */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Final Combined Report Pending</h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {report.incompleteReason || 
                    'All three assessment rounds must be successfully completed and saved before the final combined overall score is generated.'}
                </p>
                <div className="text-[11px] text-amber-800 font-medium pt-1">
                  <strong>Strict Weighting Policy: </strong>
                  Weights (Resume 30%, MCQ 30%, Video 40%) are never redistributed silently. The overall composite score is computed strictly when all 3 valid saved scores exist.
                </div>
              </div>
            </div>
          </div>

          {/* Round-by-Round Completion Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Round 1 */}
            <div className={`p-5 rounded-2xl border ${resumeDone ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Round 1 (30%)</span>
                {resumeDone ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Resume Evaluation</h4>
              <p className="text-xs text-gray-500 mb-4">Match score & domain skills alignment</p>
              {resumeDone ? (
                <div className="text-2xl font-black text-emerald-700">{report.resumeScore}%</div>
              ) : (
                <Link
                  to={`/assessment/${session.id}/resume`}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1"
                >
                  Complete Round 1 <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* Round 2 */}
            <div className={`p-5 rounded-2xl border ${mcqDone ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Round 2 (30%)</span>
                {mcqDone ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
                    {session.mcqUnlocked ? 'Available' : 'Locked'}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">MCQ Technical</h4>
              <p className="text-xs text-gray-500 mb-4">Multiple-choice technical assessment</p>
              {mcqDone ? (
                <div className="text-2xl font-black text-emerald-700">{report.mcqScore}%</div>
              ) : session.mcqUnlocked ? (
                <Link
                  to={`/assessment/${session.id}/mcq`}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1"
                >
                  Start MCQ Round <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <div className="text-xs text-gray-400 italic">Complete Round 1 to unlock</div>
              )}
            </div>

            {/* Round 3 */}
            <div className={`p-5 rounded-2xl border ${videoDone ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Round 3 (40%)</span>
                {videoDone ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
                    {session.videoUnlocked ? 'Available' : 'Locked'}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">AI Video Interview</h4>
              <p className="text-xs text-gray-500 mb-4">Competency & verbal technical answers</p>
              {videoDone ? (
                <div className="text-2xl font-black text-emerald-700">{report.videoScore}%</div>
              ) : session.videoUnlocked ? (
                <Link
                  to={`/assessment/${session.id}/video`}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1"
                >
                  Start Video Round <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <div className="text-xs text-gray-400 italic">Complete Round 2 to unlock</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: COMPLETED COMBINED ASSESSMENT REPORT
  // =========================================================================
  const resumeScore = report.resumeScore ?? 0;
  const mcqScore = report.mcqScore ?? 0;
  const videoScore = report.videoScore ?? 0;
  const overallScore = report.overallScore ?? 0;

  const resumeCard = report.resumeCard;
  const mcqCard = report.mcqCard;
  const videoCard = report.videoCard;

  const chartData = [
    { name: `Resume (${Math.round((report.resumeWeight || 0.30) * 100)}%)`, score: resumeScore, fill: '#7C3AED' },
    { name: `MCQ (${Math.round((report.mcqWeight || 0.30) * 100)}%)`, score: mcqScore, fill: '#6D28D9' },
    { name: `Video (${Math.round((report.videoWeight || 0.40) * 100)}%)`, score: videoScore, fill: '#5B21B6' },
    { name: 'Overall Combined', score: overallScore, fill: '#10B981' }
  ];

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 print:p-0">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Navigation & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <Link
            to={`/assessment/${session.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assessment Hub
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenHistory}
              className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <History className="w-4 h-4 text-violet-600" /> Report History
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-violet-700" /> Print / Export PDF
            </button>

            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="print:hidden">
          <AssessmentStageStepper
            session={session}
            activeStage="FINAL_REPORT"
            onNavigateStage={(stg) => {
              if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stg === 'MCQ_ASSESSMENT') navigate(`/assessment/${session.id}/mcq`);
              else if (stg === 'VIDEO_INTERVIEW') navigate(`/assessment/${session.id}/video`);
            }}
          />
        </div>

        {/* HERO CARD: Overall Score & Metadata */}
        <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-violet-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-violet-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl -z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-emerald-300 border border-white/15 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Sequential Assessment Verified
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Candidate Competency Evaluation Report
              </h1>
              
              <p className="text-violet-200 text-sm max-w-xl">
                Comprehensive 3-stage performance dossier for <strong>{report.jobRoleName}</strong> ({report.difficulty} Tier).
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-violet-300">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-violet-400" /> Assessment #{session.id}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-violet-400" /> Completed: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Today'}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-violet-200 text-[10px] font-bold">
                  Weights: Resume {Math.round(report.resumeWeight * 100)}% • MCQ {Math.round(report.mcqWeight * 100)}% • Video {Math.round(report.videoWeight * 100)}%
                </span>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="text-center md:text-right bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/20 shadow-inner min-w-[200px] shrink-0">
              <div className="text-xs uppercase font-bold tracking-wider text-violet-200 mb-1">
                Combined Overall Score
              </div>
              <div className="text-5xl font-black text-white tracking-tight">
                {overallScore}%
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full inline-block border border-emerald-400/30">
                {overallScore >= 80 ? 'Exceptional Candidate' : overallScore >= 65 ? 'Qualified Candidate' : 'Baseline Competency'}
              </div>
            </div>
          </div>
        </div>

        {/* VISUAL COMPARISON CHART & WEIGHTING FORMULA */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Score Distribution & Formula Weighting</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {report.formulaText || 'Overall Score = (Resume Score × 0.30) + (MCQ Score × 0.30) + (Video Score × 0.40)'}
              </p>
            </div>
            <div className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-200 shrink-0">
              Validated By System Engine
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#4B5563' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SCORECARD 1: RESUME EVALUATION */}
        {/* ===================================================================== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Scorecard 1 of 3</span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Weight: {Math.round(report.resumeWeight * 100)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Resume Evaluation</h3>
                <p className="text-xs text-gray-500">
                  Target Role: <strong>{resumeCard?.targetRole || report.jobRoleName}</strong>
                  {resumeCard?.companyName && <span> • Target Company: <strong>{resumeCard.companyName}</strong></span>}
                </p>
              </div>
            </div>

            <div className="text-right bg-violet-50/70 border border-violet-100 px-5 py-3 rounded-2xl shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Resume Match Score</span>
              <span className="text-3xl font-black text-violet-700 block">{resumeScore}%</span>
            </div>
          </div>

          {/* 6-Dimension Scoring Breakdown */}
          {resumeCard?.scoringBreakdown && (
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Transparent Dimension-by-Dimension Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 block">Technical Skills</span>
                  <span className="text-lg font-black text-violet-800">{resumeCard.scoringBreakdown.technicalSkillScore ?? 85}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 block">Projects Depth</span>
                  <span className="text-lg font-black text-violet-800">{resumeCard.scoringBreakdown.projectExperienceScore ?? 80}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 block">Work Experience</span>
                  <span className="text-lg font-black text-violet-800">{resumeCard.scoringBreakdown.internshipWorkScore ?? 75}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 block">Education & Certs</span>
                  <span className="text-lg font-black text-violet-800">{resumeCard.scoringBreakdown.educationCertScore ?? 90}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 block">Practical Evidence</span>
                  <span className="text-lg font-black text-violet-800">{resumeCard.scoringBreakdown.practicalEvidenceScore ?? 80}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 block">Role Alignment</span>
                  <span className="text-lg font-black text-violet-800">{resumeCard.scoringBreakdown.roleAlignmentScore ?? 85}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Matched vs. Missing Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <span className="text-xs font-bold text-emerald-900 block">
                Matched Role Skills ({resumeCard?.matchedSkills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resumeCard?.matchedSkills && resumeCard.matchedSkills.length > 0 ? (
                  resumeCard.matchedSkills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium">
                      {typeof s === 'string' ? s : s.skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">None detected</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
              <span className="text-xs font-bold text-amber-900 block">
                Missing / Recommended Skills ({resumeCard?.missingSkills?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resumeCard?.missingSkills && resumeCard.missingSkills.length > 0 ? (
                  resumeCard.missingSkills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium">
                      {typeof s === 'string' ? s : `${s.skill} (${s.importance || 'High'})`}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Comprehensive skill coverage</span>
                )}
              </div>
            </div>
          </div>

          {/* Relevant Projects */}
          {resumeCard?.relevantProjects && resumeCard.relevantProjects.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Evidenced Projects</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resumeCard.relevantProjects.map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-gray-900 font-bold">{p.title}</strong>
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
                        {p.relevanceScore}% match
                      </span>
                    </div>
                    {p.description && <p className="text-gray-600 text-[11px] line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.matchedTechnologies?.map((t, tidx) => (
                        <span key={tidx} className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-gray-200 text-gray-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {resumeCard?.strengths && resumeCard.strengths.length > 0 && (
              <div className="p-4 rounded-2xl bg-violet-50/40 border border-violet-100 text-xs space-y-1.5">
                <strong className="text-violet-900 font-bold block">Documented Strengths:</strong>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-[11px]">
                  {resumeCard.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>
            )}
            {resumeCard?.recommendations && resumeCard.recommendations.length > 0 && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                <strong className="text-gray-900 font-bold block">Resume Recommendations:</strong>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-[11px]">
                  {resumeCard.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SCORECARD 2: MCQ TECHNICAL ASSESSMENT */}
        {/* ===================================================================== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Scorecard 2 of 3</span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Weight: {Math.round(report.mcqWeight * 100)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">MCQ Technical Assessment</h3>
                <p className="text-xs text-gray-500">
                  {mcqCard?.totalQuestionsCount || 20} Multiple-Choice Domain Questions • {report.difficulty} Tier
                </p>
              </div>
            </div>

            <div className="text-right bg-violet-50/70 border border-violet-100 px-5 py-3 rounded-2xl shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">MCQ Score</span>
              <span className="text-3xl font-black text-violet-700 block">{mcqScore}%</span>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[10px] font-semibold text-gray-500 block uppercase">Total Questions</span>
              <span className="text-2xl font-black text-gray-900">{mcqCard?.totalQuestionsCount ?? 20}</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
              <span className="text-[10px] font-semibold text-emerald-700 block uppercase">Correct Answers</span>
              <span className="text-2xl font-black text-emerald-800">{mcqCard?.correctAnswersCount ?? 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
              <span className="text-[10px] font-semibold text-rose-700 block uppercase">Incorrect Answers</span>
              <span className="text-2xl font-black text-rose-800">{mcqCard?.incorrectAnswersCount ?? 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
              <span className="text-[10px] font-semibold text-amber-700 block uppercase">Unanswered</span>
              <span className="text-2xl font-black text-amber-800">{mcqCard?.unansweredCount ?? 0}</span>
            </div>
          </div>

          {/* Topic-Wise Performance */}
          {mcqCard?.topicWisePerformance && mcqCard.topicWisePerformance.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Topic-Wise Performance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mcqCard.topicWisePerformance.map((topic, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-gray-900">{topic.topic}</span>
                      <span className="text-violet-700">{topic.percentage}% ({topic.correct}/{topic.total})</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${topic.percentage >= 70 ? 'bg-emerald-500' : topic.percentage >= 50 ? 'bg-violet-600' : 'bg-rose-500'}`}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question-By-Question Review Accordion */}
          {mcqCard?.questions && mcqCard.questions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                MCQ Question-by-Question Review & Explanations ({mcqCard.questions.length})
              </h4>
              <div className="space-y-2">
                {mcqCard.questions.map((q) => {
                  const isExpanded = expandedMcqQuestion === q.sequenceNumber;
                  return (
                    <div key={q.sequenceNumber} className="border border-gray-200 rounded-2xl p-4 transition-all">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedMcqQuestion(isExpanded ? null : q.sequenceNumber)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            q.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            Q{q.sequenceNumber}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-gray-900 line-clamp-1">{q.questionText}</span>
                            <span className="text-[10px] text-gray-500">{q.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            q.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {q.isCorrect ? 'Correct' : 'Missed'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {q.options?.map((opt, oIdx) => {
                              const letter = String.fromCharCode(65 + oIdx);
                              const isCandidateChoice = q.selectedOption === letter;
                              const isCorrectOption = q.correctOption === letter;
                              return (
                                <div key={oIdx} className={`p-2 rounded-xl border flex items-center gap-2 ${
                                  isCorrectOption 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                                    : isCandidateChoice 
                                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                                    : 'bg-white border-gray-100 text-gray-600'
                                }`}>
                                  <span className="font-bold">{letter}.</span>
                                  <span>{opt}</span>
                                  {isCandidateChoice && <span className="ml-auto text-[9px] font-bold bg-white px-1.5 py-0.2 rounded border">Your Pick</span>}
                                  {isCorrectOption && <span className="ml-auto text-[9px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">Correct</span>}
                                </div>
                              );
                            })}
                          </div>
                          {q.explanation && (
                            <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 text-[11px] text-violet-950">
                              <strong>Explanation: </strong>{q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Identified Learning Gaps */}
          {mcqCard?.learningGaps && mcqCard.learningGaps.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs space-y-1.5">
              <strong className="text-amber-900 block font-bold">Identified Conceptual Learning Gaps:</strong>
              <div className="flex flex-wrap gap-1.5">
                {mcqCard.learningGaps.map((gap, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* SCORECARD 3: AI VIDEO INTERVIEW */}
        {/* ===================================================================== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Scorecard 3 of 3</span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Weight: {Math.round(report.videoWeight * 100)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">AI Video Interview</h3>
                <p className="text-xs text-gray-500">
                  Technical Architecture & Real-Time Verbal Communication
                </p>
              </div>
            </div>

            <div className="text-right bg-violet-50/70 border border-violet-100 px-5 py-3 rounded-2xl shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Video Round Score</span>
              <span className="text-3xl font-black text-violet-700 block">{videoScore}%</span>
            </div>
          </div>

          {/* 5-Dimension Technical Quality Breakdown */}
          {videoCard?.technicalAnswerQualityBreakdown && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Technical Answer Quality 5-Dimension Formula
                </h4>
                <span className="text-[10px] text-gray-400">40% + 20% + 15% + 15% + 10% = 100%</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-violet-50/60 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 block font-medium">Tech Correctness (40%)</span>
                  <span className="text-xl font-black text-violet-800 mt-1 block">
                    {videoCard.technicalAnswerQualityBreakdown.technicalCorrectness}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
                  <span className="text-[10px] text-gray-500 block font-medium">Structure & Clarity (20%)</span>
                  <span className="text-xl font-black text-indigo-800 mt-1 block">
                    {videoCard.technicalAnswerQualityBreakdown.answerStructureClarity}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
                  <span className="text-[10px] text-gray-500 block font-medium">Concept Usage (15%)</span>
                  <span className="text-xl font-black text-purple-800 mt-1 block">
                    {videoCard.technicalAnswerQualityBreakdown.roleConceptUsage}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
                  <span className="text-[10px] text-gray-500 block font-medium">Speech Fluency (15%)</span>
                  <span className="text-xl font-black text-blue-800 mt-1 block">
                    {videoCard.technicalAnswerQualityBreakdown.speechFluency}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-gray-500 block font-medium">Communication (10%)</span>
                  <span className="text-xl font-black text-emerald-800 mt-1 block">
                    {videoCard.technicalAnswerQualityBreakdown.communicationEffectiveness}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Speech Fluency, Rate, Tone & Confidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hesitation & Fluency */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
              <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-600" /> Speech Hesitation & Fluency Metrics
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">Total Filler Words</span>
                  <span className="font-bold text-gray-900">{videoCard?.hesitationAndFluencyMetrics?.totalFillerWordsCount ?? 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">Speaking Rate</span>
                  <span className="font-bold text-gray-900">{videoCard?.speechRate?.averageSpeakingWpm ?? 130} WPM</span>
                  <span className="text-[10px] text-gray-400 block">({videoCard?.speechRate?.speechRateClassification || 'NORMAL'})</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">Pause Count (≥0.35s)</span>
                  <span className="font-bold text-gray-900">{videoCard?.hesitationAndFluencyMetrics?.totalPauseCount ?? 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                  <span className="text-[10px] text-gray-500 block">Repeated Words</span>
                  <span className="font-bold text-gray-900">{videoCard?.hesitationAndFluencyMetrics?.totalRepeatedWordsCount ?? 0}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic">
                Note: Natural pauses and conversational filler words are cognitive deliberation markers and never penalize technical domain accuracy.
              </p>
            </div>

            {/* Prosody, Sentiment & Confidence Calibration */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
              <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-violet-600" /> Prosody, Sentiment & Confidence Calibration
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-gray-100">
                  <span className="text-gray-600">Acoustic Prosody Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                    {videoCard?.prosodyAndMeasurements?.prosodyStatus || 'UNAVAILABLE'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-gray-100">
                  <span className="text-gray-600">Linguistic Sentiment:</span>
                  <span className="font-bold text-violet-700">
                    {videoCard?.sentimentAndIntensity?.sentimentLabel || 'CONFIDENT'} ({videoCard?.sentimentAndIntensity?.sentimentReliability || 'HIGH'} Reliability)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-gray-100">
                  <span className="text-gray-600">Confidence Calibration:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    videoCard?.confidenceCalibration?.dominantLabel === 'POSSIBLE_OVERCONFIDENCE'
                      ? 'bg-amber-100 text-amber-800'
                      : videoCard?.confidenceCalibration?.dominantLabel === 'POSSIBLE_UNDERCONFIDENCE'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {videoCard?.confidenceCalibration?.dominantLabel || 'CALIBRATED'}
                  </span>
                </div>
              </div>
              {videoCard?.prosodyAndMeasurements?.prosodyNotes && (
                <p className="text-[10px] text-gray-500 italic">
                  {videoCard.prosodyAndMeasurements.prosodyNotes}
                </p>
              )}
            </div>
          </div>

          {/* Per-Question Video Interview Accordion */}
          {videoCard?.questions && videoCard.questions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Video Questions Review & Candidate Transcripts ({videoCard.questions.length})
              </h4>
              <div className="space-y-2">
                {videoCard.questions.map((vq) => {
                  const isExpanded = expandedVideoQuestion === vq.sequenceNumber;
                  return (
                    <div key={vq.sequenceNumber} className="border border-gray-200 rounded-2xl p-4 transition-all">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedVideoQuestion(isExpanded ? null : vq.sequenceNumber)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0 border border-violet-100">
                            Q{vq.sequenceNumber}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-gray-900 line-clamp-1">{vq.questionText}</span>
                            <span className="text-[10px] text-gray-500">{vq.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-black text-violet-700">{vq.questionScore ?? vq.technicalScore ?? 80}%</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
                          {/* Transcript */}
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 leading-relaxed">
                            <strong className="text-gray-600 block text-[10px] uppercase font-sans mb-1">Transcript:</strong>
                            {vq.transcript || 'No transcript captured for this take.'}
                          </div>

                          {/* Concepts */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                              <span className="font-bold text-emerald-800 block mb-1">Matched Key Points:</span>
                              <div className="flex flex-wrap gap-1">
                                {vq.matchedKeyPoints && vq.matchedKeyPoints.length > 0 ? (
                                  vq.matchedKeyPoints.map((m, midx) => (
                                    <span key={midx} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                                      {m}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400">None detected</span>
                                )}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                              <span className="font-bold text-amber-800 block mb-1">Missing / Suggested Concepts:</span>
                              <div className="flex flex-wrap gap-1">
                                {vq.missingKeyPoints && vq.missingKeyPoints.length > 0 ? (
                                  vq.missingKeyPoints.map((m, midx) => (
                                    <span key={midx} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                                      {m}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400">Comprehensive coverage</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Feedback & Calibration */}
                          {vq.feedback && (
                            <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 text-[11px] text-violet-950">
                              <strong>Qualitative Feedback: </strong>{vq.feedback}
                            </div>
                          )}
                          {vq.confidenceCalibrationExplanation && (
                            <div className="p-2 rounded-xl bg-gray-50 border text-[10px] text-gray-600">
                              <strong>Confidence Calibration: </strong>{vq.confidenceCalibrationExplanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* SYNTHESIZED INSIGHTS: STRENGTHS & SKILL GAPS */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Overall Synthesized Strengths
            </h4>
            <ul className="space-y-2 text-xs text-gray-700">
              {report.overallStrengths && report.overallStrengths.length > 0 ? (
                report.overallStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">Solid baseline across core technical competencies.</li>
              )}
            </ul>
          </div>

          {/* Skill Gaps */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> High-Priority Skill Gaps
            </h4>
            <ul className="space-y-2 text-xs text-gray-700">
              {report.overallSkillGaps && report.overallSkillGaps.length > 0 ? (
                report.overallSkillGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/40 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span className="font-medium text-gray-900">{gap}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No significant critical skill gaps detected.</li>
              )}
            </ul>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* PERSONALIZED LEARNING ROADMAP */}
        {/* ===================================================================== */}
        {report.learningRoadmap && report.learningRoadmap.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Personalized Learning Roadmap</h4>
                <p className="text-xs text-gray-500">
                  Custom milestone progression tailored to your demonstrated performance in {report.jobRoleName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.learningRoadmap.map((phase, pIdx) => (
                <div key={pIdx} className="p-5 rounded-2xl bg-violet-50/40 border border-violet-100 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full">
                        {phase.duration || `Milestone ${pIdx + 1}`}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-gray-900">{phase.phase}</h5>
                    <p className="text-[11px] text-gray-500 mt-1">{phase.focus}</p>

                    <ul className="mt-3 space-y-1.5 text-[11px] text-gray-700">
                      {phase.actions?.map((act, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-violet-600 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* DATA PRIVACY & RECORDING RETENTION POLICY */}
        {/* ===================================================================== */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Data Privacy & Media Retention Policy</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recordings are stored in private server storage and retained for up to 30 days under platform policy. You may permanently delete your video recordings at any time.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {recordingsDeleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Recordings Permanently Purged
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-700 hover:text-rose-700 border border-gray-200 hover:border-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Purge Video Recordings
                </button>
              )}
            </div>
          </div>

          {deleteMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{deleteMessage}</span>
            </div>
          )}
        </div>

        {/* Confirmation Modal for Permanent Deletion */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Delete Video Recordings?</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                All raw WebM and MP4 video recordings of your answers will be permanently deleted from private server storage. Your evaluated scores, transcripts, and final report will remain preserved.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deletingRecordings}
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingRecordings}
                  onClick={handleDeleteRecordings}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deletingRecordings ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" /> Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* RESPONSIBLE-USE DISCLAIMER */}
        {/* ===================================================================== */}
        <div className="p-6 rounded-3xl bg-violet-50/50 border border-violet-100 text-xs text-gray-600 space-y-2">
          <div className="flex items-center gap-2 text-violet-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <span>Responsible-Use & Ethical AI Evaluation Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-600">
            {report.disclaimer || 
              'InterviewVerse assessment scores and qualitative evaluations are structured decision-support aids designed to assist human hiring teams and provide actionable learning feedback for candidates. Scores are not automated, definitive employment determinations.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-center gap-4 pt-4 print:hidden">
          <Link
            to="/interview/setup"
            className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-xs transition-colors inline-flex items-center gap-2"
          >
            Start New Assessment Pipeline <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* REPORT HISTORY MODAL */}
      {/* ===================================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-bold text-gray-900">Your Saved Assessment Reports</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-gray-500">
                <div className="w-8 h-8 rounded-full border-2 border-violet-100 border-t-violet-600 animate-spin mx-auto mb-2" />
                Loading your report history...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No other saved assessment reports found.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-gray-200 hover:border-violet-300 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-gray-900">{item.jobRoleName}</strong>
                        <span className="text-[10px] text-violet-700 bg-violet-50 px-2 py-0.2 rounded font-semibold">
                          {item.difficulty}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Past Assessment'} • Session #{item.assessmentSessionId}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-black text-violet-700 block">
                          {item.overallScore != null ? `${item.overallScore}%` : 'Incomplete'}
                        </span>
                        <span className="text-[9px] text-gray-400 block">{item.status}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowHistoryModal(false);
                          navigate(`/assessment/${item.assessmentSessionId}/report`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        Open <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
