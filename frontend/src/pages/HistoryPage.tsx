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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-white">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <span className="text-sm text-gray-500">Loading interview records...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 bg-white min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <History className="w-7 h-7 text-violet-600" />
            <span>Interview History & Reports</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Review past mock interview sessions, questions answered, and stored technical scores.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-500/20 flex items-center gap-2 transition-all"
        >
          <PlayCircle className="w-4 h-4" />
          <span>New Interview</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Row */}
      {interviews.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600 font-medium">Filter Domain:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-violet-600"
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
                className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {item.difficulty}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-violet-50 text-violet-700 border border-violet-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1">{item.jobRoleName}</h3>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-4 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(item.startedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-mono text-violet-700 font-semibold">{item.mode}</span>
                  </div>

                  <div className="text-xs text-gray-600 pb-2">
                    Progress: <strong className="text-gray-900">{item.answeredQuestionsCount} / {item.totalQuestions} Questions</strong>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
                  {isCompleted ? (
                    <Link
                      to={`/interview/${item.id}/report`}
                      className="w-full text-center py-2 px-3 rounded-xl text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-violet-600" />
                      <span>View Full Report</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/interview/${item.id}`}
                      className="w-full text-center py-2 px-3 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
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
        <div className="p-12 rounded-3xl bg-violet-50/50 border border-dashed border-violet-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No Interviews Completed Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Select a job domain and start a mock interview. Your responses, scores, and evaluations will appear here.
          </p>
          <Link
            to="/interview/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-xs"
          >
            <span>Start Practice Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
