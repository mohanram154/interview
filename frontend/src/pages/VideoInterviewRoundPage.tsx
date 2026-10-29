import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi } from '../api/assessmentApi';
import { AssessmentSession, VideoQuestion, VideoInterviewStatus } from '../types/assessment';
import { AssessmentStageGuard } from '../components/assessment/AssessmentStageGuard';
import { AssessmentStageStepper } from '../components/assessment/AssessmentStageStepper';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Square, 
  RotateCcw, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Check, 
  Award, 
  EyeOff, 
  UserCheck, 
  RefreshCw, 
  AlertTriangle,
  Radio
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

const MAX_RECORDING_DURATION_SECONDS = 180; // 3 minutes max per question

const VideoInterviewContent: React.FC<ContentProps> = ({ session, onUpdated }) => {
  const navigate = useNavigate();

  // Media references & hardware preview
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMic, setHasMic] = useState<boolean>(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Consent & Setup state
  const [consentGiven, setConsentGiven] = useState<boolean>(session.videoConsentGivenAt != null);
  const [consentAgreed, setConsentAgreed] = useState<boolean>(false);
  const [recordingSupported, setRecordingSupported] = useState<boolean>(true);
  const [recordingMimeType, setRecordingMimeType] = useState<string>('video/webm');

  // Questions & Navigation state
  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active recording & playback state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [candidateNotes, setCandidateNotes] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  // Text-to-speech for reading questions
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Check MediaRecorder browser capabilities
  useEffect(() => {
    if (typeof window !== 'undefined' && 'MediaRecorder' in window) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        setRecordingMimeType('video/webm;codecs=vp8,opus');
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        setRecordingMimeType('video/webm');
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        setRecordingMimeType('video/mp4');
      } else {
        setRecordingSupported(false);
      }
    } else {
      setRecordingSupported(false);
    }
  }, []);

  // Initialize camera and microphone stream
  const initializeDevices = async () => {
    try {
      setDeviceError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setDeviceError('Your browser does not support camera and microphone recording. Please use modern Chrome, Edge, or Firefox.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      setStream(mediaStream);
      setHasCamera(mediaStream.getVideoTracks().length > 0);
      setHasMic(mediaStream.getAudioTracks().length > 0);

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Device permission denied or device unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setDeviceError('Camera and microphone access was denied. Please allow camera and mic permissions in your browser URL bar to proceed.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setDeviceError('No camera or microphone hardware found. Please connect your audio/video devices and refresh.');
      } else {
        setDeviceError(`Could not access media devices: ${err.message || 'Unknown hardware error'}`);
      }
    }
  };

  // Wire live stream to video element whenever stream changes
  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Web Audio dynamic microphone volume visualizer
  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;

    let audioContext: AudioContext | null = null;
    let animationFrameId: number;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('AudioContext volume meter unavailable:', err);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };
  }, [stream]);

  // Load existing session status, consent, and questions
  const loadInterviewData = async () => {
    try {
      setLoading(true);
      setActionError(null);

      // Start round if not yet started
      if (session.videoStageStatus === 'AVAILABLE') {
        await assessmentApi.startOrResumeVideoRound(session.id);
      }

      const statusResp = await assessmentApi.getVideoInterviewStatus(session.id);
      setConsentGiven(statusResp.consentGiven);
      setQuestions(statusResp.questions || []);

      // If consent was previously given and questions exist, set active index to first incomplete question
      if (statusResp.questions && statusResp.questions.length > 0) {
        const firstPendingIdx = statusResp.questions.findIndex(q => q.status !== 'UPLOADED');
        if (firstPendingIdx !== -1) {
          setCurrentQuestionIndex(firstPendingIdx);
        }
      }
    } catch (err: any) {
      console.error('Failed to load video interview status:', err);
      setActionError(err.response?.data?.message || 'Could not load video interview session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviewData();
    initializeDevices();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [session.id]);

  // Cleanup recorded preview URL when question or blob changes
  useEffect(() => {
    if (recordedPreviewUrl) {
      URL.revokeObjectURL(recordedPreviewUrl);
      setRecordedPreviewUrl(null);
    }
    setRecordedBlob(null);
    setUploadProgress(null);
  }, [currentQuestionIndex]);

  // Live recording timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev + 1 >= MAX_RECORDING_DURATION_SECONDS) {
            stopRecording();
            return MAX_RECORDING_DURATION_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Handle explicit consent submission
  const handleConfirmConsent = async () => {
    try {
      setActionError(null);
      setLoading(true);

      const statusResp = await assessmentApi.recordVideoConsent(session.id, true);
      setConsentGiven(true);
      setQuestions(statusResp.questions || []);
      setCurrentQuestionIndex(0);
    } catch (err: any) {
      console.error('Consent recording error:', err);
      setActionError(err.response?.data?.message || 'Failed to record candidate consent. Please verify hardware permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech reader for question
  const handleToggleSpeakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Start in-browser MediaRecorder
  const startRecording = () => {
    if (!stream) {
      setActionError('Camera and microphone stream are not ready. Please verify permissions.');
      return;
    }

    try {
      setActionError(null);
      recordedChunksRef.current = [];
      setRecordedBlob(null);
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl(null);
      }

      const recorder = new MediaRecorder(stream, { mimeType: recordingMimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: recordingMimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setRecordedPreviewUrl(url);
        setIsRecording(false);
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err: any) {
      console.error('Failed to start MediaRecorder:', err);
      setActionError(`Recording initiation failed: ${err.message || 'MediaRecorder unsupported'}`);
    }
  };

  // Stop active recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Discard recording and allow retry
  const handleResetRecording = () => {
    if (recordedPreviewUrl) {
      URL.revokeObjectURL(recordedPreviewUrl);
      setRecordedPreviewUrl(null);
    }
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setUploadProgress(null);
    setActionError(null);
  };

  // Upload recording to backend
  const handleUploadAnswer = async () => {
    const activeQuestion = questions[currentQuestionIndex];
    if (!activeQuestion || !recordedBlob) return;

    try {
      setIsUploading(true);
      setActionError(null);
      setUploadProgress(0);

      const updatedQuestion = await assessmentApi.uploadVideoRecording(
        session.id,
        activeQuestion.id,
        recordedBlob,
        recordingSeconds,
        candidateNotes,
        (percent) => setUploadProgress(percent)
      );

      // Update question list locally
      setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
      setRecordedBlob(null);
      setCandidateNotes('');
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl(null);
      }

      // Automatically advance to next unanswered question if available
      const nextIdx = questions.findIndex((q, i) => i > currentQuestionIndex && q.status !== 'UPLOADED');
      if (nextIdx !== -1) {
        setCurrentQuestionIndex(nextIdx);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setActionError(err.response?.data?.message || 'Failed to upload answer recording. You can retry safely.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Complete and submit Round 3
  const handleFinishVideoRound = async () => {
    try {
      setIsFinishing(true);
      setActionError(null);

      await assessmentApi.finishVideoInterview(session.id);

      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      await onUpdated();
    } catch (err: any) {
      console.error('Finish video round error:', err);
      setActionError(err.response?.data?.message || 'Failed to submit video interview round.');
    } finally {
      setIsFinishing(false);
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // SCREEN 3: COMPLETED VIEW
  // =========================================================================
  if (session.videoStageStatus === 'COMPLETED' && session.videoScore != null) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to={`/assessment/${session.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Assessment Hub
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Round 3 Completed
            </span>
          </div>

          <AssessmentStageStepper
            session={session}
            activeStage="VIDEO_INTERVIEW"
            onNavigateStage={(stg) => {
              if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stg === 'MCQ_ASSESSMENT') navigate(`/assessment/${session.id}/mcq`);
              else if (stg === 'FINAL_REPORT') navigate(`/assessment/${session.id}/report`);
            }}
          />

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Round 3: Verified</span>
                    <h3 className="text-xl font-bold text-gray-900">AI Video Interview Evaluated</h3>
                    <p className="text-xs text-gray-600">{session.jobRoleName} • Sentiment: {session.videoSentimentLabel || 'CONFIDENT'}</p>
                  </div>
                </div>

                <div className="text-right bg-white px-5 py-3 rounded-2xl border border-emerald-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Video Round Score</div>
                  <div className="text-3xl font-black text-emerald-700">{session.videoScore}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Technical Competency Score</div>
                  <div className="text-2xl font-black text-gray-900">{session.videoTechnicalScore || session.videoScore}%</div>
                  <p className="text-[11px] text-gray-500 mt-1">Evaluated across domain architecture & problem solving</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Communication Clarity Score</div>
                  <div className="text-2xl font-black text-gray-900">{session.videoCommunicationScore || session.videoScore}%</div>
                  <p className="text-[11px] text-gray-500 mt-1">Evaluated across speech pace, structure, & articulation</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-xs text-gray-700 leading-relaxed">
                <strong className="text-gray-900">AI Competency Evaluation:</strong> {session.videoFeedback || 'Candidate demonstrated articulate domain expertise and clear technical communication.'}
              </div>
            </div>

            {/* Unlocked Final Report Banner */}
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

  // =========================================================================
  // SCREEN 1: PRE-RECORDING DEVICE CHECK & ETHICAL AI CONSENT GATE
  // =========================================================================
  if (!consentGiven) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              to={`/assessment/${session.id}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Assessment Hub
            </Link>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
              Round 3 of 3: Pre-Recording Setup
            </span>
          </div>

          <AssessmentStageStepper
            session={session}
            activeStage="VIDEO_INTERVIEW"
            onNavigateStage={(stg) => {
              if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
              else if (stg === 'MCQ_ASSESSMENT') navigate(`/assessment/${session.id}/mcq`);
            }}
          />

          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Hardware Readiness & Transparency Disclosure
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Round 3: AI Video Interview Verification
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Before commencing the interview, confirm your hardware preview and review the ethical AI evaluation disclosure below.
              </p>
            </div>

            {/* Hardware Diagnostic & Live Video Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera Preview */}
              <div className="bg-gray-900 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[260px] text-white">
                <div className="flex items-center justify-between z-10">
                  <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/10">
                    <span className={`w-2 h-2 rounded-full ${hasCamera ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {hasCamera ? 'Camera Connected' : 'Camera Standby'}
                  </span>

                  <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/10">
                    <span className={`w-2 h-2 rounded-full ${hasMic ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {hasMic ? 'Mic Detected' : 'Mic Missing'}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center my-3 rounded-xl bg-gray-950 overflow-hidden relative">
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${!hasCamera ? 'hidden' : ''}`}
                  />
                  {!hasCamera && (
                    <div className="text-center p-6 text-gray-400">
                      <VideoOff className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                      <p className="text-xs text-gray-300">Camera preview unavailable</p>
                      <button
                        type="button"
                        onClick={initializeDevices}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Device Access
                      </button>
                    </div>
                  )}
                </div>

                {/* Microphone Level Visualizer */}
                <div className="z-10 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-gray-300 mb-1">
                      <span>Mic Input Level</span>
                      <span>{audioLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full transition-all duration-150"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Diagnostic Checklist */}
              <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                    System Hardware Diagnostic
                  </h4>

                  <ul className="space-y-3 text-xs">
                    <li className="flex items-start gap-2.5">
                      {hasCamera ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="text-gray-900">Video Capture: </strong>
                        <span className="text-gray-600">
                          {hasCamera ? 'High-definition camera active.' : 'Camera stream pending permission.'}
                        </span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5">
                      {hasMic ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="text-gray-900">Audio Input: </strong>
                        <span className="text-gray-600">
                          {hasMic ? 'Microphone audio input detected and calibrated.' : 'Microphone pending permission.'}
                        </span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5">
                      {recordingSupported ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="text-gray-900">MediaRecorder API: </strong>
                        <span className="text-gray-600">
                          {recordingSupported ? `Supported format: ${recordingMimeType}` : 'Browser unsupported.'}
                        </span>
                      </div>
                    </li>

                    <li className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-gray-900">Secure Storage: </strong>
                        <span className="text-gray-600">
                          Answers stored privately on server; access restricted strictly to your account.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                {deviceError && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                    <strong>Note: </strong>{deviceError}
                  </div>
                )}
              </div>
            </div>

            {/* Ethical AI Disclosure & Transparency Cards */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Ethical AI Evaluation Transparency
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What is analyzed */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> WHAT WILL BE ANALYZED
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                    <li>Spoken technical depth and architectural reasoning.</li>
                    <li>Relevance to target role competencies ({session.jobRoleName}).</li>
                    <li>Communication clarity, articulation, and solution structuring.</li>
                    <li>Problem-solving trade-offs and domain knowledge.</li>
                  </ul>
                </div>

                {/* What is NOT analyzed */}
                <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-200/80">
                  <div className="flex items-center gap-2 text-violet-800 text-xs font-bold mb-2">
                    <EyeOff className="w-4 h-4 text-violet-600" /> WHAT IS NOT ANALYZED (ETHICAL AI)
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                    <li>Facial expressions and micro-expressions are <strong>never</strong> analyzed.</li>
                    <li>Eye contact, gaze tracking, and physical gestures are <strong>ignored</strong>.</li>
                    <li>Body language and posture are <strong>not</strong> evaluated.</li>
                    <li>Appearance, race, gender, accent, and personality traits are strictly excluded.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Explicit Consent Checkbox & Action Button */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300"
                />
                <span className="text-xs text-gray-700 leading-relaxed select-none">
                  I give explicit consent to record my spoken audio and video interview answers. 
                  I acknowledge that evaluation is strictly limited to technical competency and verbal communication clarity, 
                  and that facial expressions, eye contact, body language, and personality are explicitly excluded.
                </span>
              </label>

              <button
                type="button"
                onClick={handleConfirmConsent}
                disabled={!consentAgreed || loading}
                className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Recording Consent & Generating Tailored Questions...
                  </>
                ) : (
                  <>
                    Confirm Consent & Begin Video Interview <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: ACTIVE VIDEO INTERVIEW ARENA
  // =========================================================================
  const activeQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const allUploaded = totalQuestions > 0 && questions.every(q => q.status === 'UPLOADED');
  const uploadedCount = questions.filter(q => q.status === 'UPLOADED').length;

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Session Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            to={`/assessment/${session.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Assessment Hub
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <Radio className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
            Round 3 of 3: AI Video Interview ({session.jobRoleName} • {session.difficulty})
          </span>
        </div>

        <AssessmentStageStepper
          session={session}
          activeStage="VIDEO_INTERVIEW"
          onNavigateStage={(stg) => {
            if (stg === 'RESUME_EVALUATION') navigate(`/assessment/${session.id}/resume`);
            else if (stg === 'MCQ_ASSESSMENT') navigate(`/assessment/${session.id}/mcq`);
          }}
        />

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Main Grid: Video Stream (2 cols) + Questions & Control Panel (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: Camera / Recording Stream & Dynamic Question Banner */}
          <div className="lg:col-span-2 bg-gray-900 rounded-3xl p-4 sm:p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden min-h-[480px]">
            {/* Top Bar over Video Feed */}
            <div className="flex items-center justify-between z-10 mb-3">
              <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
                {isRecording ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-rose-400 font-bold uppercase tracking-wider">REC</span>
                    <span className="font-mono text-white ml-1">{formatTimer(recordingSeconds)} / 03:00</span>
                  </>
                ) : recordedBlob ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-amber-300 font-medium">Recorded Take Ready for Review</span>
                  </>
                ) : activeQuestion?.status === 'UPLOADED' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-300 font-medium">Answer Uploaded & Saved</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                    <span>Live Ready Stream</span>
                  </>
                )}
              </div>

              {/* Dynamic Mic Level Visualizer */}
              <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
                <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                <div className="w-16 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-400 h-full rounded-full transition-all duration-150"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Video Feed (Live Stream or Recorded Take Preview) */}
            <div className="flex-1 flex items-center justify-center rounded-2xl bg-gray-950 overflow-hidden relative min-h-[300px]">
              {/* Review Recorded Video Player */}
              {recordedPreviewUrl ? (
                <video
                  ref={previewVideoRef}
                  src={recordedPreviewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                /* Live Camera Stream */
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${!hasCamera ? 'hidden' : ''}`}
                />
              )}

              {!hasCamera && !recordedPreviewUrl && (
                <div className="text-center p-8 text-gray-400 max-w-sm">
                  <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-300">Camera preview standby</p>
                  <p className="text-[11px] text-gray-500 mt-1">Audio recording remains active</p>
                </div>
              )}
            </div>

            {/* Active Question Banner Overlay */}
            {activeQuestion && (
              <div className="z-10 mt-4 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded-md border border-violet-800/50">
                      Question {activeQuestion.sequenceNumber} of {totalQuestions}
                    </span>
                    <span className="text-[11px] font-medium text-gray-300">
                      {activeQuestion.category}
                    </span>
                  </div>

                  {/* Read Aloud Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSpeakQuestion(activeQuestion.questionText)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-violet-200 transition-colors"
                    title="Read Question Aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                    <span>{isSpeaking ? 'Stop Reading' : 'Listen'}</span>
                  </button>
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed">
                  {activeQuestion.questionText}
                </p>

                {activeQuestion.tailoredSource && activeQuestion.tailoredSource !== 'ROLE_CORE' && (
                  <div className="text-[10px] text-violet-300/80 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Tailored from your parsed resume ({activeQuestion.tailoredSource.replace('_', ' ')})</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT 1 COL: Controls, Question Navigator, Upload Progress */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              {/* Question Navigator Pills */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Questions Progress
                  </span>
                  <span className="text-xs font-bold text-violet-700">
                    {uploadedCount} / {totalQuestions} Completed
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isDone = q.status === 'UPLOADED';

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          if (isRecording) stopRecording();
                          setCurrentQuestionIndex(idx);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isCurrent
                            ? 'bg-violet-600 text-white shadow-xs'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>Q{q.sequenceNumber}</span>
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status & Recording Controls */}
              <div className="space-y-3">
                <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Target Role:</span>
                    <strong className="text-gray-900">{session.jobRoleName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Difficulty Tier:</span>
                    <strong className="text-violet-700">{session.difficulty}</strong>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Current Question Status:</span>
                    {activeQuestion?.status === 'UPLOADED' ? (
                      <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Saved
                      </span>
                    ) : (
                      <span className="font-bold text-amber-700">Pending Answer</span>
                    )}
                  </div>

                  {activeQuestion?.status === 'UPLOADED' && (
                    <div className="pt-2 border-t border-violet-100 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Speech Articulation:</span>
                        <strong className="text-emerald-700 font-bold">{activeQuestion.speechClarityLevel || 'HIGH'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Filler Words:</span>
                        <strong className="text-gray-900">{activeQuestion.fillerWordsCount ?? 0}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Spoken Notes / Transcript Outline */}
                {activeQuestion?.status !== 'UPLOADED' && !isRecording && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block">
                      Spoken Notes / Key Technical Outline (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={candidateNotes}
                      onChange={(e) => setCandidateNotes(e.target.value)}
                      placeholder="Outline key architectural concepts discussed in this take..."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="p-3 bg-violet-50 border border-violet-200 rounded-2xl space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-violet-900">
                      <span>Uploading Answer Video...</span>
                      <span>{uploadProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-violet-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-600 h-full rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Recording Control Buttons */}
                <div className="space-y-2">
                  {!isRecording && !recordedBlob && (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isUploading}
                      className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{activeQuestion?.status === 'UPLOADED' ? 'Record New Take' : 'Start Recording Answer'}</span>
                    </button>
                  )}

                  {isRecording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop & Review Recording ({formatTimer(recordingSeconds)})</span>
                    </button>
                  )}

                  {recordedBlob && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleUploadAnswer}
                        disabled={isUploading}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading Video...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" /> Save & Submit Answer Q{activeQuestion?.sequenceNumber}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetRecording}
                        disabled={isUploading}
                        className="w-full py-2.5 rounded-2xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Discard & Retake
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Controls: Previous / Next / Complete Round */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isRecording) stopRecording();
                    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                  }}
                  disabled={currentQuestionIndex === 0 || isUploading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-colors disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isRecording) stopRecording();
                    setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1));
                  }}
                  disabled={currentQuestionIndex === totalQuestions - 1 || isUploading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-colors disabled:opacity-40"
                >
                  Next
                </button>
              </div>

              {/* Complete Video Interview Round Button */}
              <button
                type="button"
                onClick={handleFinishVideoRound}
                disabled={uploadedCount === 0 || isFinishing || isUploading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Video Competency & Finalizing Round...
                  </>
                ) : (
                  <>
                    Complete Video Interview Round <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              {uploadedCount < totalQuestions && (
                <p className="text-[10px] text-gray-400 text-center">
                  Tip: Answer all questions for optimal competency scoring ({uploadedCount}/{totalQuestions} recorded).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
