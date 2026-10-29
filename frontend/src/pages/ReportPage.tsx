import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Report } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Briefcase, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  PlayCircle,
  LayoutDashboard,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
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

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<ApiResponse<Report>>(`/interviews/${id}/report`);
        if (res.data.success && res.data.data) {
          setReport(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load evaluation report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const toggleQuestion = (idx: number) => {
    setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading comprehensive evaluation report...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Report Unavailable</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">{error || 'Could not find report.'}</p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              Dashboard
            </Link>
            <Link
              to={`/interview/${id}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400"
            >
              Resume Interview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Bar chart breakdown
  const categoryChartData = [
    { name: 'Technical (40%)', score: report.technicalScore, color: '#38bdf8' },
    { name: 'Clarity (15%)', score: report.communicationScore, color: '#818cf8' },
    { name: 'Overall Score', score: report.overallScore, color: '#34d399' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Evaluation Completed
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Interview Evaluation Report
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
            <span>Role: <strong className="text-slate-200">{report.jobRoleName}</strong></span>
            <span>•</span>
            <span>Difficulty: <strong className="text-slate-200">{report.difficulty}</strong></span>
            <span>•</span>
            <span>Mode: <strong className="text-slate-200">{report.mode}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/interview/new"
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-sky-500 hover:bg-sky-400 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Practice Another</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Score Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Badge */}
        <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/80 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Overall Competency</span>
            </div>
            <div className="text-5xl font-black text-white mt-1">
              {report.overallScore}
              <span className="text-lg font-normal text-slate-400"> / 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Calculated using the 4-dimensional technical interview rubric.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Technical: <strong className="text-sky-400">{report.technicalScore}%</strong></span>
            <span>Clarity: <strong className="text-indigo-400">{report.communicationScore}%</strong></span>
          </div>
        </div>

        {/* Chart View */}
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/80 shadow-lg md:col-span-2 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Score Breakdown by Category
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={11} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Weights: 40% Technical Accuracy, 25% Relevance, 20% Completeness, 15% Clarity.
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/70 space-y-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Evaluation Executive Summary</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {report.summary}
        </p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/70 space-y-3">
          <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Demonstrated Strengths</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/70 space-y-3">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Target Areas for Improvement</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.improvementAreas.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations Card */}
      <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-3">
        <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>Actionable Practice Recommendations</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Per-Question Answer & Evaluation Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <span>Per-Question Detailed Audit</span>
        </h2>

        {(report.questions || []).map((q, idx) => {
          const isExpanded = expandedQuestions[idx] ?? true;
          const evalObj = q.answer?.evaluation;
          return (
            <div key={q.id} className="rounded-2xl border border-slate-700/80 bg-slate-800/40 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleQuestion(idx)}
                className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                    Q{idx + 1}
                  </span>
                  <div className="font-semibold text-sm text-white line-clamp-1">{q.questionText}</div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {evalObj && (
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {evalObj.overallScore}/100
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-700/50 space-y-4 text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 mt-3">
                      Candidate Submitted Response
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 leading-relaxed font-mono text-xs">
                      {q.answer?.answerText || 'No answer submitted.'}
                    </div>
                  </div>

                  {evalObj && (
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>AI Technical Evaluation</span>
                        <span>{evalObj.overallScore} / 100</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{evalObj.feedback}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-400">
                        <div>Accuracy: <strong className="text-sky-400">{evalObj.technicalAccuracyScore}</strong></div>
                        <div>Relevance: <strong className="text-sky-400">{evalObj.relevanceScore}</strong></div>
                        <div>Completeness: <strong className="text-sky-400">{evalObj.completenessScore}</strong></div>
                        <div>Clarity: <strong className="text-sky-400">{evalObj.clarityScore}</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
