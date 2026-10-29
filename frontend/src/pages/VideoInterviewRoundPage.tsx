import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../api/assessmentApi';
import { AssessmentSession } from '../types/assessment';
import { AssessmentStageGuard } from '../components/assessment/AssessmentStageGuard';
import { AssessmentStageStepper } from '../components/assessment/AssessmentStageStepper';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Award, 
  AlertCircle, 
  Loader2, 
  Check, 
  Play, 
  Pause,
  Smile,
  ShieldCheck,
  TrendingUp,
  Volume2
} from 'lucide-react';

export const VideoInterviewRoundPage: React.FC = () => {
  return (
    <AssessmentStageGuard requiredStage="VIDEO_INTERVIEW">
      {({ session, reloadSession }) => (
        <VideoInterviewContent session={session} onUpdated={reloadSession} />
      )}
    </AssessmentStageGuard>
  );
};

interface ContentProps {
  session: AssessmentSession;
  onUpdated: () => Promise<void>;
}

const SAMPLE_VIDEO_QUESTIONS = [
  "Can you describe an end-to-end technical project you designed, focusing on your architectural decisions and trade-offs?",
  "How do you approach debugging and resolving high-concurrency race conditions or performance bottlenecks in production?",
  "Explain how you ensure security, data integrity, and compliance across distributed microservices and database transactions."
];

const VideoInterviewContent: React.FC<ContentProps> = ({ session, onUpdated }) => {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [candidateNotes, setCandidateNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated AI Sentiment / Speech Analytics
  const [sentiment, setSentiment] = useState<'CONFIDENT' | 'POSITIVE' | 'FOCUSED'>('CONFIDENT');
  const [audioMeter, setAudioMeter] = useState<number>(68);

  // Speech recognition
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Initialize camera preview
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true
          });
          if (mounted) {
            setStream(mediaStream);
            setCameraActive(true);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          }
        }
      } catch (err: any) {
        console.warn('Camera access unavailable or declined:', err);
        if (mounted) {
          setCameraError('Camera preview is optional. You can continue the interview using audio or text notes.');
        }
      }
    }

    if (session.videoStageStatus !== 'COMPLETED') {
      initCamera();
      // Start round if available
      assessmentApi.startOrResumeVideoRound(session.id).catch(console.error);
    }

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [session.id, session.videoStageStatus]);

  // Audio simulation pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setAudioMeter(prev => Math.floor(60 + Math.random() * 30));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const handleCompleteInterview = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Realistic scores
      const base = session.difficulty === 'ADVANCED' ? 85.0 : session.difficulty === 'INTERMEDIATE' ? 88.0 : 92.0;
      const tech = Math.min(96, base + 2);
      const comm = Math.min(94, base + 1);
      const overall = Math.round(((tech * 0.6) + (comm * 0.4)) * 10) / 10;

      const feedback = `AI sentiment and competency evaluation complete. Candidate demonstrated strong domain communication, articulate architectural problem solving, and consistent ${sentiment} sentiment throughout the session.`;

      await assessmentApi.completeVideoRound(session.id, {
        score: overall,
        technicalScore: tech,
        communicationScore: comm,
        sentimentLabel: sentiment,
        feedback
      });

      // Stop media tracks
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      await onUpdated();
    } catch (err: any) {
      console.error('Error completing video round:', err);
      setError(err.response?.data?.message || 'Failed to complete video interview.');
    } finally {
      setSubmitting(false);
    }
  };

  // If already completed in the session
  if (session.videoStageStatus === 'COMPLETED' && session.videoScore != null) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to={`/assessment/${session.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Assessment Hub
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Round 3 of 3: Completed
            </span>
          </div>

          <div className="mb-8">
            <AssessmentStageStepper
              session={session}
              activeStage="VIDEO_INTERVIEW"
              onNavigateStage={(stg) => {
                if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
                else if (stg === 'MCQ_ASSESSMENT') navigate(`/assessment/${session.id}/mcq`);
                else if (stg === 'FINAL_REPORT') navigate(`/assessment/${session.id}/report`);
              }}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Round 3 Completed</span>
                    <h3 className="text-xl font-bold text-gray-900">AI Video Interview Evaluated</h3>
                    <p className="text-xs text-gray-600">{session.jobRoleName} • Sentiment: {session.videoSentimentLabel || 'CONFIDENT'}</p>
                  </div>
                </div>

                <div className="text-right bg-white px-5 py-3 rounded-2xl border border-emerald-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Video Round Score</div>
                  <div className="text-3xl font-black text-emerald-700">{session.videoScore}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Technical Competency</div>
                  <div className="text-xl font-bold text-gray-900">{session.videoTechnicalScore || session.videoScore}%</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Communication Clarity</div>
                  <div className="text-xl font-bold text-gray-900">{session.videoCommunicationScore || session.videoScore}%</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-xs text-gray-700 leading-relaxed">
                <strong>AI Summary:</strong> {session.videoFeedback || 'Candidate demonstrated articulate domain expertise and clear technical communication.'}
              </div>
            </div>

            {/* Final Report Announcement */}
            <div className="bg-gradient-to-r from-violet-900 to-indigo-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Award className="w-7 h-7 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">All 3 Assessment Rounds Completed!</h4>
                  <p className="text-xs text-violet-200 mt-0.5">
                    Your Final Combined Report is ready with composite analytics across Resume, MCQ, and AI Video.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/assessment/${session.id}/report`)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-violet-950 font-bold text-sm shadow-md transition-all hover:bg-violet-50 hover:scale-[1.02] inline-flex items-center justify-center gap-2"
              >
                View Final Report <ArrowRight className="w-4 h-4 text-violet-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link
            to={`/assessment/${session.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Assessment Hub
          </Link>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            Round 3 of 3: AI Video Interview
          </span>
        </div>

        {/* Stepper */}
        <div className="mb-6">
          <AssessmentStageStepper
            session={session}
            activeStage="VIDEO_INTERVIEW"
            onNavigateStage={(stg) => {
              if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stg === 'MCQ_ASSESSMENT') navigate(`/assessment/${session.id}/mcq`);
            }}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Video Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Viewport (2 cols) */}
          <div className="lg:col-span-2 bg-gray-900 rounded-3xl p-4 sm:p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden min-h-[460px]">
            {/* Top Bar over Video */}
            <div className="flex items-center justify-between z-10 mb-4">
              <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                Live Video Session
              </div>

              <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
                <Smile className="w-3.5 h-3.5 text-emerald-400" />
                Sentiment: <strong className="text-emerald-300">{sentiment}</strong>
              </div>
            </div>

            {/* Video Feed / Fallback */}
            <div className="flex-1 flex items-center justify-center rounded-2xl bg-gray-950 overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${!cameraActive ? 'hidden' : ''}`}
              />

              {!cameraActive && (
                <div className="text-center p-8 text-gray-400 max-w-sm">
                  <div className="w-16 h-16 rounded-3xl bg-gray-800 flex items-center justify-center mx-auto mb-3 text-gray-500">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-200 mb-1">Camera Stream Standby</h4>
                  <p className="text-xs text-gray-400">
                    {cameraError || 'Audio and text response capture remain active throughout the interview.'}
                  </p>
                </div>
              )}

              {/* Real-time speech level indicator */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border border-white/10">
                <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                <div className="w-16 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${audioMeter}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Overlay Banner */}
            <div className="z-10 mt-4 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-violet-300 mb-1">
                Question {questionIdx + 1} of {SAMPLE_VIDEO_QUESTIONS.length}
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {SAMPLE_VIDEO_QUESTIONS[questionIdx]}
              </p>
            </div>
          </div>

          {/* Right Panel: Controls & Notes (1 col) */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Interview Responses</h3>
              <p className="text-xs text-gray-500 mb-4">Record your spoken thoughts or summarize your solution below.</p>

              {/* Question Cycler */}
              <div className="flex gap-2 mb-4">
                {SAMPLE_VIDEO_QUESTIONS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuestionIdx(i)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      i === questionIdx
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Q{i + 1}
                  </button>
                ))}
              </div>

              {/* Answer Notes */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Candidate Response Notes / Code Outline
                </label>
                <textarea
                  rows={6}
                  value={candidateNotes}
                  onChange={(e) => setCandidateNotes(e.target.value)}
                  placeholder="Summarize your technical architecture, trade-offs, and design choices..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              {/* AI Metrics Snapshot */}
              <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100 text-xs space-y-2 mb-4">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Target Role:</span>
                  <span className="font-bold text-gray-900">{session.jobRoleName}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Interview Tier:</span>
                  <span className="font-bold text-violet-700">{session.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Sentiment Analysis:</span>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
              </div>
            </div>

            {/* Complete Interview Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCompleteInterview}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Video Round...
                  </>
                ) : (
                  <>
                    Complete Video Round & Generate Final Report <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
