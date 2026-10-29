import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Interview } from '../types/interview';
import { ApiResponse } from '../types/auth';
import { 
  History, 
  Calendar, 
  Briefcase, 
  Award, 
  PlayCircle, 
  Loader2, 
  AlertCircle,
  Filter,
  ArrowRight
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<ApiResponse<Interview[]>>('/interviews');
        if (res.data.success) {
          setInterviews(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch interview history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const uniqueRoles = Array.from(new Set(interviews.map(i => i.jobRoleName)));
  const filtered = interviews.filter(i => roleFilter === 'ALL' || i.jobRoleName === roleFilter);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading interview records...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-sky-400" />
            <span>Interview History & Reports</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Review past mock interview sessions, questions answered, and stored technical competency scores.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-sky-500 hover:bg-sky-400 shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <PlayCircle className="w-4 h-4" />
          <span>New Interview</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Row */}
      {interviews.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Filter Domain:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Domains ({interviews.length})</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      )}

      {/* Interviews Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/70 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                      {item.difficulty}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{item.jobRoleName}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.startedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-mono">{item.mode}</span>
                  </div>

                  <div className="text-xs text-slate-400 pb-2">
                    Progress: <strong className="text-slate-200">{item.answeredQuestionsCount} / {item.totalQuestions} Questions</strong>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-700/50 flex items-center justify-between">
                  {isCompleted ? (
                    <Link
                      to={`/interview/${item.id}/report`}
                      className="w-full text-center py-2 px-3 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>View Full Report</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/interview/${item.id}`}
                      className="w-full text-center py-2 px-3 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Resume Interview</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-800/20 border border-dashed border-slate-700 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Interviews Completed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select a job domain and start a mock interview. Your responses, scores, and AI evaluations will appear here.
          </p>
          <Link
            to="/interview/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-colors shadow-sm"
          >
            <span>Start Practice Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
