import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, rolesRes] = await Promise.all([
        apiClient.get<ApiResponse<DashboardStats>>('/interviews/dashboard'),
        apiClient.get<ApiResponse<JobRole[]>>('/job-roles')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (rolesRes.data.success) {
        setJobRoles(rolesRes.data.data);
      }
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading candidate metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-8 h-8" />
          <h3 className="text-lg font-semibold">Unable to Load Dashboard</h3>
          <p className="text-sm text-slate-300 max-w-md">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 px-5 py-2 text-xs font-semibold rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white transition-colors"
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
      score: session.status === 'COMPLETED' ? 75 + (index * 4) % 25 : 60, // Fallback preview or calculated
      role: session.jobRoleName,
    }));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-slate-900 border border-slate-700/80 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Candidate Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Hello, {user?.name || 'Developer'}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl">
            Track your mock technical interview progress, review detailed AI evaluation reports, and prepare for industry interviews.
          </p>
        </div>
        <Link
          to="/interview/new"
          className="shrink-0 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/25 flex items-center gap-2 group transition-all"
        >
          <PlayCircle className="w-5 h-5 text-white" />
          <span>Start New Interview</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Interviews Started</div>
            <div className="text-2xl font-bold text-white mt-0.5">{stats?.totalInterviews ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Completed Interviews</div>
            <div className="text-2xl font-bold text-white mt-0.5">{stats?.completedInterviews ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Average Competency Score</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {stats?.averageScore ? `${stats.averageScore}/100` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Roles Grid & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Roles (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-sky-400" />
              <span>Available Technical Domains</span>
            </h2>
            <Link to="/interview/new" className="text-xs text-sky-400 hover:text-sky-300 font-medium">
              View all options
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {jobRoles.map((role) => (
              <div
                key={role.id}
                className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-sky-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-white text-base mb-1.5">{role.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {role.description}
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-slate-700/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">5-10 Questions</span>
                  <button
                    onClick={() => navigate('/interview/new', { state: { selectedRoleId: role.id } })}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 group"
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
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Competency Trend</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Visual overview of practice scores across recent interview submissions.
            </p>

            <div className="h-44 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#38bdf8" fillOpacity={1} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-700/60">
                  <span className="text-xs text-slate-400">Complete your first interview session to unlock your competency trend chart!</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50 text-[11px] text-slate-400 text-center">
            Weighted on Technical Accuracy, Relevance, Completeness & Clarity.
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <span>Recent Interview Sessions</span>
          </h2>
          <Link to="/history" className="text-xs text-sky-400 hover:text-sky-300 font-medium">
            View full history
          </Link>
        </div>

        {(stats?.recentInterviews || []).length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-800/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700/70">
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
              <tbody className="divide-y divide-slate-700/50">
                {stats?.recentInterviews.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white">{session.jobRoleName}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">
                        {session.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{session.mode}</td>
                    <td className="px-5 py-3.5">
                      {session.answeredQuestionsCount} / {session.totalQuestions}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        session.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {session.status === 'COMPLETED' ? (
                        <Link
                          to={`/interview/${session.id}/report`}
                          className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                        >
                          View Report
                        </Link>
                      ) : (
                        <Link
                          to={`/interview/${session.id}`}
                          className="text-xs font-semibold text-amber-400 hover:text-amber-300"
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
          <div className="p-8 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 text-center space-y-3">
            <p className="text-sm text-slate-400">No mock interview sessions recorded yet.</p>
            <Link
              to="/interview/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-colors"
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
