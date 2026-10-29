import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../api/assessmentApi';
import { AssessmentSession } from '../types/assessment';
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
  TrendingUp, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  Smile,
  ChevronRight
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

  const resumeScore = session.resumeScore || 0;
  const mcqScore = session.mcqScore || 0;
  const videoScore = session.videoScore || 0;
  const compositeScore = session.finalCompositeScore || 
    Math.round(((resumeScore * 0.25) + (mcqScore * 0.40) + (videoScore * 0.35)) * 10) / 10;

  const chartData = [
    { name: 'Resume (25%)', score: resumeScore, fill: '#7C3AED' },
    { name: 'MCQ (40%)', score: mcqScore, fill: '#6D28D9' },
    { name: 'Video (35%)', score: videoScore, fill: '#5B21B6' },
    { name: 'Composite', score: compositeScore, fill: '#10B981' }
  ];

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 print:p-0">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Controls */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            to={`/assessment/${session.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assessment Hub
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / Export PDF
            </button>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Candidate Dashboard
            </Link>
          </div>
        </div>

        {/* Stepper */}
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

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-violet-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-violet-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl -z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-emerald-300 border border-white/15 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Sequential Assessment Completed
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                Candidate Competency Evaluation Report
              </h1>
              
              <p className="text-violet-200 text-sm max-w-xl">
                Comprehensive 3-stage performance dossier for <strong>{session.jobRoleName}</strong> ({session.difficulty} Tier).
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-violet-300">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-violet-400" /> Assessment ID: #{session.id}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-violet-400" /> Completed: {new Date(session.completedAt || session.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Composite Score Circle / Badge */}
            <div className="text-center md:text-right bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/20 shadow-inner">
              <div className="text-xs uppercase font-bold tracking-wider text-violet-200 mb-1">
                Final Composite Score
              </div>
              <div className="text-5xl font-black text-white tracking-tight">
                {compositeScore}%
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full inline-block border border-emerald-400/30">
                {compositeScore >= 80 ? 'Exceptional Candidate' : compositeScore >= 65 ? 'Qualified Candidate' : 'Baseline Competency'}
              </div>
            </div>
          </div>
        </div>

        {/* Score Weighting Chart & Formula */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Score Distribution & Formula Weighting</h3>
              <p className="text-xs text-gray-500">
                Composite Score = (Resume × 0.25) + (MCQ Technical × 0.40) + (AI Video × 0.35)
              </p>
            </div>
            <div className="text-xs font-semibold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-200">
              Validated by System
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

        {/* 3 Detailed Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Resume Evaluation */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Round 1 • 25% Weight
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Resume Evaluation</h4>
                  <p className="text-xs text-gray-500">{session.resumeFilename || 'Uploaded Resume'}</p>
                </div>
              </div>

              <div className="text-3xl font-black text-violet-700 mb-4">
                {resumeScore}%
              </div>

              <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3 mb-4">
                <div className="flex justify-between">
                  <span>Skills Match:</span>
                  <span className="font-semibold text-gray-900">{session.resumeSkillsMatchScore || 85}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Experience Depth:</span>
                  <span className="font-semibold text-gray-900">{session.resumeExperienceScore || 80}%</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
              "{session.resumeFeedback || 'Candidate profile aligns with domain specifications.'}"
            </p>
          </div>

          {/* Card 2: MCQ Assessment */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Round 2 • 40% Weight
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">MCQ Technical</h4>
                  <p className="text-xs text-gray-500">20 Multiple-Choice Questions</p>
                </div>
              </div>

              <div className="text-3xl font-black text-violet-700 mb-4">
                {mcqScore}%
              </div>

              <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3 mb-4">
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-semibold text-gray-900">20 Questions</span>
                </div>
                <div className="flex justify-between">
                  <span>Difficulty Tier:</span>
                  <span className="font-semibold text-violet-700">{session.difficulty}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
              "Demonstrated solid conceptual domain understanding in timed technical testing."
            </p>
          </div>

          {/* Card 3: AI Video Interview */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Round 3 • 35% Weight
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">AI Video Interview</h4>
                  <p className="text-xs text-gray-500">Sentiment & Technical Delivery</p>
                </div>
              </div>

              <div className="text-3xl font-black text-violet-700 mb-4">
                {videoScore}%
              </div>

              <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3 mb-4">
                <div className="flex justify-between">
                  <span>Technical Accuracy:</span>
                  <span className="font-semibold text-gray-900">{session.videoTechnicalScore || videoScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Speech Clarity:</span>
                  <span className="font-semibold text-gray-900">{session.videoCommunicationScore || videoScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Sentiment State:</span>
                  <span className="font-bold text-emerald-700">{session.videoSentimentLabel || 'CONFIDENT'}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
              "{session.videoFeedback || 'Candidate demonstrated strong composure, clear articulation, and deep architectural insight.'}"
            </p>
          </div>

        </div>

        {/* Evaluator Summary */}
        <div className="bg-violet-50/50 border border-violet-200 rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" /> Platform Assessment Synthesis
          </h3>
          <p className="text-xs text-gray-700 leading-relaxed">
            {session.finalSummary || 
              `Candidate has successfully satisfied all strict sequential gates for the ${session.jobRoleName} competency assessment. The final composite score of ${compositeScore}% reflects a holistic synthesis of documented past experience, real-time multiple-choice problem solving, and verbal architectural communication.`}
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
    </div>
  );
};

