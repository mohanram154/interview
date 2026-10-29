import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../api/assessmentApi';
import { 
  AssessmentSession, 
  ParsedResumeData, 
  ResumeEvaluationResult 
} from '../types/assessment';
import { AssessmentStageGuard } from '../components/assessment/AssessmentStageGuard';
import { AssessmentStageStepper } from '../components/assessment/AssessmentStageStepper';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Check, 
  Briefcase, 
  Building2, 
  ShieldAlert, 
  TrendingUp, 
  Award, 
  RefreshCw, 
  Edit3, 
  Plus, 
  Trash2, 
  HelpCircle,
  ExternalLink,
  Code2,
  FileCheck2,
  CheckCircle,
  XCircle,
  Lock
} from 'lucide-react';

const MANDATORY_ROLES = [
  'Full Stack Developer',
  'Software Developer',
  'Java Developer',
  'Frontend Developer',
  'Backend Developer',
  'Python Developer',
  'Data Analyst',
  'AI/ML Engineer'
];

export const ResumeRoundPage: React.FC = () => {
  return (
    <AssessmentStageGuard requiredStage="RESUME_EVALUATION">
      {({ session, reloadSession }) => (
        <ResumeRoundContent session={session} onUpdated={reloadSession} />
      )}
    </AssessmentStageGuard>
  );
};

interface ContentProps {
  session: AssessmentSession;
  onUpdated: () => Promise<void>;
}

type ScreenState = 'UPLOAD' | 'REVIEW' | 'RESULTS';

const ResumeRoundContent: React.FC<ContentProps> = ({ session, onUpdated }) => {
  const navigate = useNavigate();

  // Screen workflow state
  const [screen, setScreen] = useState<ScreenState>('UPLOAD');

  // Upload configurator state
  const [targetRole, setTargetRole] = useState<string>(session.jobRoleName || 'Full Stack Developer');
  const [companyName, setCompanyName] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parsing & Review state
  const [parsing, setParsing] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);

  // Final evaluation state
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<ResumeEvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If session already has a persisted resume evaluation, fetch and show results
  useEffect(() => {
    async function loadExistingEvaluation() {
      if (session.resumeStageStatus === 'COMPLETED' && session.resumeScore != null) {
        try {
          const existing = await assessmentApi.getResumeEvaluation(session.id);
          setEvaluationResult(existing);
          setScreen('RESULTS');
        } catch {
          // If detailed evaluation entity not found, keep in UPLOAD or RESULTS fallback
        }
      }
    }
    loadExistingEvaluation();
  }, [session.id, session.resumeStageStatus]);

  // Handle file selection with client validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const lower = file.name.toLowerCase();

      if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
        setErrorMsg('Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).');
        setSelectedFile(null);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File exceeds the 5 MB size limit. Please select a smaller resume file.');
        setSelectedFile(null);
        return;
      }

      if (file.size === 0) {
        setErrorMsg('Selected file is empty (0 bytes). Please upload a valid resume.');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  // Step 1: Upload and Parse file
  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a resume file (PDF or DOCX) to upload.');
      return;
    }

    try {
      setParsing(true);
      setErrorMsg(null);

      const res = await assessmentApi.uploadAndParseResume(
        session.id,
        selectedFile,
        targetRole
      );

      setParsedData(res.extractedData);
      setScreen('REVIEW');
    } catch (err: any) {
      console.error('Resume upload/parse error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to parse resume.';
      setErrorMsg(msg);
    } finally {
      setParsing(false);
    }
  };

  // Step 2: Confirm Review and run final role-based evaluation
  const handleConfirmAndEvaluate = async () => {
    if (!parsedData) return;

    try {
      setEvaluating(true);
      setErrorMsg(null);

      const result = await assessmentApi.submitResumeEvaluation(session.id, {
        targetRole,
        companyName: companyName.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
        correctedData: parsedData
      });

      setEvaluationResult(result);
      setScreen('RESULTS');
      await onUpdated();
    } catch (err: any) {
      console.error('Resume evaluation error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to evaluate resume.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={`/assessment/${session.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Assessment Hub
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            Round 1 of 3: Resume Parser & Evaluation
          </span>
        </div>

        {/* Stepper */}
        <AssessmentStageStepper
          session={session}
          activeStage="RESUME_EVALUATION"
          onNavigateStage={(stg) => {
            if (stg === 'MCQ_ASSESSMENT' && session.mcqUnlocked) navigate(`/assessment/${session.id}/mcq`);
            else if (stg === 'VIDEO_INTERVIEW' && session.videoUnlocked) navigate(`/assessment/${session.id}/video`);
            else if (stg === 'FINAL_REPORT' && session.finalReportUnlocked) navigate(`/assessment/${session.id}/report`);
          }}
        />

        {/* Error Alert with Retry */}
        {errorMsg && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="leading-relaxed font-medium">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setScreen('UPLOAD');
              }}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Upload
            </button>
          </div>
        )}

        {/* =========================================================================
            SCREEN 1: UPLOAD & CONFIGURATOR
           ========================================================================= */}
        {screen === 'UPLOAD' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
            <div className="border-b border-gray-100 pb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                Stage 1 Initializer
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Upload & Role-Based Resume Evaluation
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Upload your resume in PDF or DOCX format. Your credentials will be parsed and contextually evaluated against domain benchmarks.
              </p>
            </div>

            {/* Target Role Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-900">
                1. Select Target Engineering Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MANDATORY_ROLES.map((role) => {
                  const isSelected = targetRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`p-3.5 rounded-2xl text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'bg-violet-50 border-violet-600 text-violet-900 ring-2 ring-violet-500/20 shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <span>{role}</span>
                      {isSelected && <Check className="w-4 h-4 text-violet-600 self-end mt-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Company & Job Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Target Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, Amazon, Microsoft, or Target Startup"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  Job Description / Role Requirements (Optional)
                </label>
                <textarea
                  rows={2}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste specific job requirements or leave empty to evaluate against standard industry profile..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Benchmark Notice */}
            <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 text-xs text-gray-700 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-violet-900 block mb-0.5">Transparent Role Benchmarking</strong>
                {jobDescription.trim() ? (
                  <span>Evaluating against your custom provided job description.</span>
                ) : (
                  <span>
                    No specific job description provided. Your resume will be evaluated against the standard industry profile for <strong>{targetRole}</strong>. Note: this assessment does not claim to know proprietary internal company hiring criteria.
                  </span>
                )}
              </div>
            </div>

            {/* File Upload Dropzone */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                2. Upload Resume (PDF or DOCX, Max 5 MB) <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-violet-200 hover:border-violet-400 bg-violet-50/30 rounded-3xl p-8 text-center transition-colors">
                <input
                  type="file"
                  id="resume-upload-input"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="resume-upload-input" className="cursor-pointer flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-violet-200 text-violet-600 flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{selectedFile.name}</span>
                      <span className="text-xs text-violet-700 font-semibold mt-1 inline-block">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different file
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">
                        Drag & drop or <span className="text-violet-600 underline">browse your resume</span>
                      </span>
                      <span className="text-xs text-gray-500 mt-1 block">
                        PDF or DOCX up to 5 MB. Scanned images are processed via OCR where available.
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleUploadAndParse}
                disabled={parsing || !selectedFile}
                className="px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-xs transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Resume Content...</span>
                  </>
                ) : (
                  <>
                    <span>Parse Resume & Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: CANDIDATE CORRECTION & REVIEW SCREEN
           ========================================================================= */}
        {screen === 'REVIEW' && parsedData && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Verification Step
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                  Candidate Review & Correction Screen
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify the extracted information below. You may correct any extraction inaccuracies before final scoring.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScreen('UPLOAD')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold self-start sm:self-auto transition-colors"
              >
                Re-upload File
              </button>
            </div>

            {/* Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Rule of Transparency:</strong> The system never invents missing information. Sections not identified in your resume are marked <em>"Not found in resume."</em> You can freely add or edit details below before submitting for evaluation.
            </div>

            {/* 1. Contact Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-violet-600" /> Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={parsedData.contactDetails.name}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      contactDetails: { ...parsedData.contactDetails, name: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email Address</label>
                  <input
                    type="text"
                    value={parsedData.contactDetails.email}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      contactDetails: { ...parsedData.contactDetails, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={parsedData.contactDetails.phone}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      contactDetails: { ...parsedData.contactDetails, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={parsedData.contactDetails.linkedin}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      contactDetails: { ...parsedData.contactDetails, linkedin: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">GitHub Profile</label>
                  <input
                    type="text"
                    value={parsedData.contactDetails.github}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      contactDetails: { ...parsedData.contactDetails, github: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">Professional Summary</label>
              <textarea
                rows={3}
                value={parsedData.summary}
                onChange={(e) => setParsedData({ ...parsedData, summary: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            {/* 3. Technical Skills */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-900">
                Technical Skills (Comma Separated)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Programming Languages</label>
                  <input
                    type="text"
                    value={parsedData.technicalSkills.programmingLanguages.join(', ')}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      technicalSkills: {
                        ...parsedData.technicalSkills,
                        programmingLanguages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Frameworks & Libraries</label>
                  <input
                    type="text"
                    value={parsedData.technicalSkills.frameworks.join(', ')}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      technicalSkills: {
                        ...parsedData.technicalSkills,
                        frameworks: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Databases & Storage</label>
                  <input
                    type="text"
                    value={parsedData.technicalSkills.databases.join(', ')}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      technicalSkills: {
                        ...parsedData.technicalSkills,
                        databases: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Developer Tools & Platforms</label>
                  <input
                    type="text"
                    value={parsedData.technicalSkills.toolsAndPlatforms.join(', ')}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      technicalSkills: {
                        ...parsedData.technicalSkills,
                        toolsAndPlatforms: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Projects Preview */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-900">
                Key Projects ({Array.isArray(parsedData.projects) ? parsedData.projects.length : 0})
              </label>
              {Array.isArray(parsedData.projects) && parsedData.projects.length > 0 ? (
                <div className="space-y-3">
                  {parsedData.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                      <div className="font-bold text-gray-900">{proj.title}</div>
                      {proj.technologies && (
                        <div className="text-violet-700 font-semibold">Tech: {proj.technologies}</div>
                      )}
                      <p className="text-gray-600 leading-relaxed">{proj.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500 italic">
                  Not found in resume.
                </div>
              )}
            </div>

            {/* 5. Work Experience / Internships */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-900">Work Experience & Internships</label>
              {Array.isArray(parsedData.experience) && parsedData.experience.length > 0 ? (
                <div className="space-y-3">
                  {parsedData.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                      <div className="font-bold text-gray-900">{exp.company} — <span className="text-gray-600 font-normal">{exp.role}</span></div>
                      <div className="text-gray-500">{exp.duration}</div>
                      <p className="text-gray-600 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500 italic">
                  Not found in resume.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setScreen('UPLOAD')}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
              >
                Back to Upload
              </button>

              <button
                type="button"
                onClick={handleConfirmAndEvaluate}
                disabled={evaluating}
                className="px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-xs transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Against {targetRole} Benchmark...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Calculate Resume Match Score</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: TRANSPARENT EVALUATION & SCORE RESULTS
           ========================================================================= */}
        {screen === 'RESULTS' && evaluationResult && (
          <div className="space-y-8">
            {/* Top Score Banner */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                    Round 1 Completed & Verified
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    Resume Evaluation Dossier
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Target Role: <strong className="text-gray-900">{evaluationResult.targetRole}</strong> • Benchmark: <strong className="text-violet-700">{evaluationResult.evaluationBenchmark}</strong>
                  </p>
                </div>

                <div className="text-center md:text-right bg-violet-50 border border-violet-200 px-8 py-5 rounded-3xl shrink-0">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-violet-600 mb-0.5">
                    Resume Match Score
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-violet-900">
                    {evaluationResult.overallMatchScore}%
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                    {evaluationResult.overallMatchScore >= 75 ? 'Strong Match' : 'Baseline Competency'}
                  </div>
                </div>
              </div>

              {/* Benchmark Disclaimer Notice */}
              <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed">
                <strong>Benchmark Reference:</strong> {evaluationResult.benchmarkNote}
              </div>

              {/* 6 Category Score Breakdown with Transparent Weights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Technical Skills</div>
                  <div className="text-xl font-black text-violet-700 mt-1">{evaluationResult.technicalSkillScore}%</div>
                  <div className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">30% Weight</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Project Depth</div>
                  <div className="text-xl font-black text-violet-700 mt-1">{evaluationResult.projectExperienceScore}%</div>
                  <div className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">25% Weight</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Internship / Work</div>
                  <div className="text-xl font-black text-violet-700 mt-1">{evaluationResult.internshipWorkScore}%</div>
                  <div className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">15% Weight</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Education / Certs</div>
                  <div className="text-xl font-black text-violet-700 mt-1">{evaluationResult.educationCertScore}%</div>
                  <div className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">10% Weight</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Practical Evidence</div>
                  <div className="text-xl font-black text-violet-700 mt-1">{evaluationResult.practicalEvidenceScore}%</div>
                  <div className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">10% Weight</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Role Alignment</div>
                  <div className="text-xl font-black text-violet-700 mt-1">{evaluationResult.roleAlignmentScore}%</div>
                  <div className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">10% Weight</div>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills with Evidence Badges */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" /> Matched Skills & Evidence
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Contextually verified skills with concrete practical implementation evidence.
                  </p>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {evaluationResult.matchedSkills && evaluationResult.matchedSkills.length > 0 ? (
                      evaluationResult.matchedSkills.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-gray-900 block">{m.skill}</span>
                            <span className="text-[11px] text-gray-500">{m.evidenceNotes}</span>
                          </div>
                          {m.evidencedInProjects ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                              Evidenced
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold shrink-0">
                              Listed Only
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 italic">No matched skills recorded.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-500" /> Missing / Underrepresented Skills
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Expected domain competencies for {evaluationResult.targetRole} not evidenced in your resume.
                  </p>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {evaluationResult.missingSkills && evaluationResult.missingSkills.length > 0 ? (
                      evaluationResult.missingSkills.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-gray-900">{m.skill}</span>
                            <span className="text-gray-400 block text-[11px]">{m.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.importance === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {m.importance} Priority
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-emerald-600 font-semibold p-4 bg-emerald-50 rounded-xl">
                        All core domain competencies verified in candidate profile!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Improvement Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-violet-600" /> Candidate Strengths
                </h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {evaluationResult.strengths?.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actionable Suggestions */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" /> Actionable Improvement Suggestions
                </h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {evaluationResult.improvementSuggestions?.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CRITICAL UNLOCK CALLOUT: ROUND 2 UNLOCKED */}
            <div className="bg-gradient-to-r from-violet-900 to-indigo-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-violet-300">
                    Sequential Progression Gate Cleared
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    Round 2: MCQ Technical Assessment Unlocked
                  </h3>
                  <p className="text-xs text-violet-200 mt-1 max-w-xl">
                    Resume evaluation successfully persisted in MySQL database. You are now authorized to begin the 20-question technical round.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/assessment/${session.id}/mcq`)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-violet-950 font-bold text-sm shadow-md transition-all hover:bg-violet-50 hover:scale-[1.02] inline-flex items-center justify-center gap-2 shrink-0"
              >
                <span>Proceed to Round 2 (MCQ)</span>
                <ArrowRight className="w-4 h-4 text-violet-700" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
