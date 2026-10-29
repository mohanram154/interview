import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Report } from '../types/interview';
import { ApiResponse } from '../types/auth';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  Calendar,
  Layers,
  Sparkles,
  PlayCircle,
  LayoutDashboard,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  BookOpen
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
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 bg-white">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <span className="text-sm text-gray-500">Compiling interview scorecard and explanations...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 bg-white">
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900">Report Unavailable</h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto">{error || 'Could not find report.'}</p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              to={`/interview/${id}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700"
            >
              Resume Interview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMcq = report.mode === 'MCQ' || (report.totalQuestionsCount != null && report.totalQuestionsCount > 0);
  const totalQuestions = report.totalQuestionsCount ?? report.questions?.length ?? 0;
  const correctCount = report.correctAnswersCount ?? 0;
  const incorrectCount = report.incorrectAnswersCount ?? 0;
  const unansweredCount = report.unansweredCount ?? (totalQuestions - correctCount - incorrectCount);

  // Score breakdown chart data
  const mcqChartData = [
    { name: 'Correct', value: correctCount, color: '#10B981' },
    { name: 'Incorrect', value: incorrectCount, color: '#EF4444' },
    { name: 'Unanswered', value: unansweredCount, color: '#9CA3AF' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 bg-white min-h-[calc(100vh-8rem)]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Evaluation Completed
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Interview Evaluation Report
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1.5 font-medium">
            <span>Role: <strong className="text-gray-900">{report.jobRoleName}</strong></span>
            <span>•</span>
            <span>Difficulty: <strong className="text-gray-900">{report.difficulty}</strong></span>
            <span>•</span>
            <span>Mode: <strong className="text-gray-900">{report.mode}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/interview/new"
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Practice Another</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 transition-all flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Score Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Badge */}
        <div className="p-6 rounded-2xl bg-gradient-to-tr from-violet-600 to-violet-800 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-violet-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-violet-200" />
              <span>Final Assessment Score</span>
            </div>
            <div className="text-5xl font-black mt-1">
              {report.overallScore}%
            </div>
            <p className="text-xs text-violet-100 mt-3 leading-relaxed">
              {isMcq
                ? `Calculated on the backend: (${correctCount} correct / ${totalQuestions} questions) × 100.`
                : 'Weighted across technical accuracy, relevance, completeness, and clarity.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-violet-500/60 flex justify-between text-xs text-violet-100">
            <span>Accuracy: <strong>{report.overallScore}%</strong></span>
            <span>Status: <strong>{report.overallScore >= 60 ? 'PASSED' : 'NEEDS PRACTICE'}</strong></span>
          </div>
        </div>

        {/* 4 Metrics Cards (2 cols) */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-center text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Questions</div>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">{totalQuestions}</div>
            <div className="text-[11px] text-gray-500 mt-1">1 mark each</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs flex flex-col justify-center text-center">
            <div className="text-xs font-semibold text-emerald-700 uppercase flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Correct</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{correctCount}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">+{correctCount} marks</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-xs flex flex-col justify-center text-center">
            <div className="text-xs font-semibold text-rose-700 uppercase flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Incorrect</span>
            </div>
            <div className="text-3xl font-extrabold text-rose-700 mt-1">{incorrectCount}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">0 marks (No penalty)</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 shadow-xs flex flex-col justify-center text-center">
            <div className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>Unanswered</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-600 mt-1">{unansweredCount}</div>
            <div className="text-[11px] text-gray-500 font-medium mt-1">0 marks</div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-6 rounded-2xl bg-violet-50/60 border border-violet-200 space-y-2">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span>Performance Executive Summary</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          {report.summary}
        </p>
      </div>

      {/* Strengths & Topics Needing Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demonstrated Strengths */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Demonstrated Topic Mastery</span>
          </h2>
          <ul className="space-y-2 text-xs text-gray-700">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span className="font-medium">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Topics Needing Improvement */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Topics That Need Improvement</span>
          </h2>
          <ul className="space-y-2 text-xs text-gray-700">
            {report.improvementAreas.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span className="font-medium">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations Card */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-violet-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-600" />
          <span>Actionable Practice Recommendations</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100 font-medium">
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Per-Question Detailed Audit with Correct Answers & Explanations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-600" />
            <span>Detailed Question-by-Question Audit</span>
          </h2>
          <span className="text-xs text-gray-500">
            Click any question to expand or collapse
          </span>
        </div>

        {(report.questions || []).map((q, idx) => {
          const isExpanded = expandedQuestions[idx] ?? true;
          const candidateSelected = q.selectedOption || (q.answer?.selectedOption);
          const isCorrect = q.isCorrect || (q.answer?.isCorrect);
          const isAnswered = candidateSelected && candidateSelected.trim().length > 0;
          const correctOpt = q.correctOption;

          return (
            <div key={q.id || idx} className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleQuestion(idx)}
                className="w-full p-5 text-left flex items-center justify-between hover:bg-violet-50/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${!isAnswered
                      ? 'bg-gray-100 text-gray-600 border border-gray-200'
                      : isCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                    Q{idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-gray-900 line-clamp-1">{q.questionText}</div>
                    <div className="text-[11px] text-gray-500">{q.category} • {q.difficulty}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {!isAnswered ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      Unanswered
                    </span>
                  ) : isCorrect ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Correct (+1)</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Incorrect (0)</span>
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 pt-0 border-t border-gray-100 space-y-4 text-xs">
                  {/* Options List */}
                  {q.optionA && (
                    <div className="space-y-2 mt-4">
                      {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                        const optText =
                          optKey === 'A' ? q.optionA :
                            optKey === 'B' ? q.optionB :
                              optKey === 'C' ? q.optionC :
                                q.optionD;

                        if (!optText) return null;

                        const isThisCorrect = correctOpt === optKey;
                        const isThisChosen = candidateSelected === optKey;

                        let cardStyle = 'bg-white border-gray-200 text-gray-700';
                        if (isThisCorrect) {
                          cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                        } else if (isThisChosen && !isThisCorrect) {
                          cardStyle = 'bg-rose-50 border-rose-500 text-rose-900 line-through';
                        }

                        return (
                          <div
                            key={optKey}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${cardStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${isThisCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isThisChosen
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {optKey}
                              </span>
                              <span>{optText}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-[11px]">
                              {isThisChosen && (
                                <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                                  Your Choice
                                </span>
                              )}
                              {isThisCorrect && (
                                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Correct Answer</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation Card */}
                  {q.explanation && (
                    <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-violet-800 text-xs">
                        <BookOpen className="w-4 h-4 text-violet-600" />
                        <span>Verified Answer Explanation</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed font-normal">
                        {q.explanation}
                      </p>
                    </div>
                  )}

                  {/* Text Mode answer fallback */}
                  {!q.optionA && q.answer?.answerText && (
                    <div className="space-y-2 mt-3">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase">
                        Candidate Answer
                      </div>
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-mono text-xs leading-relaxed">
                        {q.answer.answerText}
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
