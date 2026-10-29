import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CandidateProfile, ProfileUpdateRequest } from '../types/profile';
import { ApiResponse } from '../types/auth';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Award, 
  Briefcase, 
  Code, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [education, setEducation] = useState('');
  const [degree, setDegree] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [preferredRole, setPreferredRole] = useState('Java Developer');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<ApiResponse<CandidateProfile>>('/profile');
        if (res.data.success && res.data.data) {
          const p = res.data.data;
          setProfile(p);
          setEducation(p.education || '');
          setDegree(p.degree || '');
          setSpecialization(p.specialization || '');
          setSkills(p.skills || 'Java, Spring Boot, MySQL, REST APIs');
          setExperienceYears(p.experienceYears || 0);
          setPreferredRole(p.preferredRole || 'Java Developer');
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload: ProfileUpdateRequest = {
      education,
      degree,
      specialization,
      skills,
      experienceYears: Number(experienceYears),
      preferredRole
    };

    try {
      const res = await apiClient.put<ApiResponse<CandidateProfile>>('/profile', payload);
      if (res.data.success) {
        setProfile(res.data.data);
        setSuccessMessage('Candidate profile updated successfully!');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <span className="text-sm text-slate-400">Loading candidate profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Candidate Profile</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Manage your verified academic background, domain skills, and interview preferences.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Readonly Account Details */}
        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Account Credentials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200">
                <User className="w-4 h-4 text-slate-400" />
                <span>{user?.name}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Verified Email</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-slate-200">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{user?.email}</span>
                <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional & Academic Information */}
        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Education & Experience</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">University / College</label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. Stanford University / MIT"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Degree & Specialization</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech in Computer Science"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="40"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Target Role</label>
              <select
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Java Developer">Java Developer</option>
                <option value="Python Developer">Python Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="SQL & Database Engineer">SQL & Database Engineer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Technical Skills (Comma-separated)
            </label>
            <div className="relative">
              <Code className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Java, Spring Boot, MySQL, Docker, React, TypeScript"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {skills.split(',').filter(s => s.trim().length > 0).map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-sky-500 hover:bg-sky-400 shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
