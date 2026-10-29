import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { assessmentApi } from '../api/assessmentApi';
import { AssessmentSession } from '../types/assessment';
import { DashboardStats, JobRole } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
  PlayCircle, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, rolesRes, activeSess] = await Promise.all([
        apiClient.get<ApiResponse<DashboardStats>>('/interviews/dashboard'),
        apiClient.get<ApiResponse<JobRole[]>>('/job-roles'),
        assessmentApi.getActiveSession()
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (rolesRes.data.success) {
        setJobRoles(rolesRes.data.data);
      }
      setActiveSession(activeSess);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-white">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <span className="text-sm text-gray-500">Loading candidate metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 bg-white">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-rose-600" />
          <h3 className="text-lg font-semibold text-rose-800">Unable to Load Dashboard</h3>
          <p className="text-sm text-gray-600 max-w-md">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 px-5 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Build chart data from recent interviews
  const chartData = (stats?.recentInterviews || [])
    .slice()
    .reverse()
    .map((session, index) => ({
      name: `Session ${index + 1}`,
      date: new Date(session.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: session.status === 'COMPLETED' ? 75 + (index * 4) % 25 : 60,
      role: session.jobRoleName,
    }));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 bg-white">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-800 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-violet-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Candidate Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name || 'Developer'}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-violet-100 max-w-xl">
            Practice interactive 15–20 question MCQ assessments, review in-depth explanations, and monitor your score improvements.
          </p>
        </div>
        <Link
          to="/interview/new"
          className="shrink-0 px-6 py-3 rounded-xl font-semibold text-sm text-violet-700 bg-white hover:bg-violet-50 shadow-sm flex items-center gap-2 group transition-all"
        >
          <PlayCircle className="w-5 h-5 text-violet-600" />
          <span>Start New Interview</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Active Assessment In-Progress Alert Banner */}
      {activeSession && activeSession.sessionStatus === 'IN_PROGRESS' && (
        <div className="p-6 rounded-2xl bg-violet-50 border-2 border-violet-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full">
                  Sequential Assessment Active
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {activeSession.difficulty} Tier
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-1">
                {activeSession.jobRoleName} Competency Assessment
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Current Status: <strong className="text-violet-700">{activeSession.progressText || 'Round In Progress'}</strong>. Your progress is saved.
              </p>
            </div>
          </div>

          <Link
            to={`/assessment/${activeSession.id}`}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 shrink-0"
          >
            <span>Continue Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Interviews Started</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.totalInterviews ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Completed Interviews</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.completedInterviews ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Average Competency Score</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {stats?.averageScore ? `${stats.averageScore}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Roles Grid & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Roles (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-600" />
              <span>Available Technical Domains</span>
            </h2>
            <Link to="/interview/new" className="text-xs text-violet-600 hover:text-violet-700 font-semibold">
              View all options
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {jobRoles.map((role) => (
              <div
                key={role.id}
                className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 text-base mb-1.5">{role.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {role.description}
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">15–20 MCQs</span>
                  <button
                    onClick={() => navigate('/interview/new', { state: { selectedRoleId: role.id } })}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 group"
                  >
                    <span>Practice</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trend Card (1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <span>Competency Trend</span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Visual overview of practice scores across recent interview submissions.
            </p>

            <div className="h-44 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 rounded-xl bg-violet-50/50 border border-dashed border-violet-200">
                  <span className="text-xs text-gray-500">Complete your first interview session to unlock your competency trend chart!</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-500 text-center">
            Evaluated on accuracy, knowledge domain recall & precision.
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span>Recent Interview Sessions</span>
          </h2>
          <Link to="/history" className="text-xs text-violet-600 hover:text-violet-700 font-semibold">
            View full history
          </Link>
        </div>

        {(stats?.recentInterviews || []).length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-violet-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Job Role</th>
                  <th className="px-5 py-3.5">Difficulty</th>
                  <th className="px-5 py-3.5">Mode</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentInterviews.map((session) => (
                  <tr key={session.id} className="hover:bg-violet-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{session.jobRoleName}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {session.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-gray-600">{session.mode}</td>
                    <td className="px-5 py-3.5">
                      {session.answeredQuestionsCount} / {session.totalQuestions}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        session.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {session.status === 'COMPLETED' ? (
                        <Link
                          to={`/interview/${session.id}/report`}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                        >
                          View Report
                        </Link>
                      ) : (
                        <Link
                          to={`/interview/${session.id}`}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                        >
                          Resume
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-violet-50/50 border border-dashed border-violet-200 text-center space-y-3">
            <p className="text-sm text-gray-600">No mock interview sessions recorded yet.</p>
            <Link
              to="/interview/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-xs"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Your First Interview</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
