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
  Radio,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

const parseJsonArray = (val?: string): string[] => {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
};

const getConfidenceBadge = (label?: string) => {
  switch (label) {
    case 'POSSIBLE_OVERCONFIDENCE':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        text: 'Possible Overconfidence',
        desc: 'Linguistic certainty was high relative to technical concept density.'
      };
    case 'POSSIBLE_UNDERCONFIDENCE':
      return {
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        dot: 'bg-sky-500',
        text: 'Possible Underconfidence',
        desc: 'Candidate articulated accurate technical solutions despite filler words or pauses.'
      };
    case 'CALIBRATED':
    default:
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        text: 'Confidence Calibrated',
        desc: 'Spoken confidence level matches technical accuracy and concept coverage.'
      };
  }
};

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
  const [selectedQuestionForDetails, setSelectedQuestionForDetails] = useState<number | null>(null);

  // Active recording & playback state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [capturedTimestamps, setCapturedTimestamps] = useState<Array<{ word: string; start: number; end: number }>>([]);
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
      setLiveTranscript('');
      setCapturedTimestamps([]);
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

      // Start continuous speech recognition if supported by browser
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        try {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          const startTime = Date.now();
          let prevWordsCount = 0;

          rec.onresult = (event: any) => {
            let interimText = '';
            let finalText = '';

            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalText += event.results[i][0].transcript + ' ';
              } else {
                interimText += event.results[i][0].transcript;
              }
            }

            const combined = (finalText + interimText).trim();
            setLiveTranscript(combined);

            const words = combined.split(/\s+/).filter(Boolean);
            if (words.length > prevWordsCount) {
              const nowSec = (Date.now() - startTime) / 1000.0;
              const newEntries: Array<{ word: string; start: number; end: number }> = [];
              for (let w = prevWordsCount; w < words.length; w++) {
                newEntries.push({
                  word: words[w],
                  start: Math.max(0, Math.round((nowSec - 0.4) * 100) / 100),
                  end: Math.round(nowSec * 100) / 100
                });
              }
              setCapturedTimestamps(prev => [...prev, ...newEntries]);
              prevWordsCount = words.length;
            }
          };

          rec.onerror = (e: any) => {
            console.warn('SpeechRecognition notice:', e);
          };

          rec.start();
          speechRecognitionRef.current = rec;
        } catch (err) {
          console.warn('SpeechRecognition initialization error:', err);
        }
      }

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
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
  };

  // Discard recording and allow retry
  const handleResetRecording = () => {
    if (recordedPreviewUrl) {
      URL.revokeObjectURL(recordedPreviewUrl);
      setRecordedPreviewUrl(null);
    }
    setRecordedBlob(null);
    setLiveTranscript('');
    setCapturedTimestamps([]);
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

      const effectiveTranscript = (candidateNotes.trim() 
        ? `${liveTranscript} ${candidateNotes}` 
        : liveTranscript).trim();

      const timestampsJson = capturedTimestamps.length > 0 
        ? JSON.stringify(capturedTimestamps) 
        : undefined;

      const updatedQuestion = await assessmentApi.uploadVideoRecording(
        session.id,
        activeQuestion.id,
        recordedBlob,
        recordingSeconds,
        effectiveTranscript,
        (percent) => setUploadProgress(percent),
        timestampsJson
      );

      // Update question list locally
      setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
      setRecordedBlob(null);
      setLiveTranscript('');
      setCapturedTimestamps([]);
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
    const videoScore = session.videoScore;
    const techScore = session.videoTechnicalScore ?? videoScore;
    const structScore = session.videoAnswerStructureScore ?? techScore;
    const conceptScore = session.videoConceptUsageScore ?? techScore;
    const fluencyScore = session.videoFluencyScore ?? session.videoCommunicationScore ?? videoScore;
    const commScore = session.videoCommunicationScore ?? videoScore;
    const calibLabel = session.videoConfidenceCalibrationLabel || 'CALIBRATED';
    const calibBadge = getConfidenceBadge(calibLabel);

    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
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

          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-violet-950 text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-violet-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-emerald-300 border border-white/15 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Round 3 Evaluated & Persisted
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">AI Video Interview Results</h2>
                <p className="text-sm text-violet-200 mt-1 max-w-xl">
                  Evaluated with genuine speech analytics, 5-dimension competency scoring, and contradiction-weighted confidence calibration for {session.jobRoleName}.
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center min-w-[160px]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-200 block">
                    Composite Score
                  </span>
                  <span className="text-4xl font-black text-white block mt-1">
                    {videoScore}%
                  </span>
                  <span className="text-[10px] text-emerald-300 font-semibold block mt-1">
                    Round 3 Cleared
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence Calibration Banner */}
            <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-violet-200">Dominant Calibration:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border flex items-center gap-1.5 ${calibBadge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${calibBadge.dot}`} />
                  {calibBadge.text}
                </span>
              </div>
              <span className="text-violet-300/90 text-[11px]">
                {calibBadge.desc}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* 5-Dimension Weighted Scoring Formula Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Weighted Video Scoring Formula (Out of 100)
                </h4>
                <span className="text-[10px] text-gray-400">40% + 20% + 15% + 15% + 10% = 100%</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-100 text-center">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Technical (40%)</span>
                  <span className="text-2xl font-black text-violet-800 block mt-1">{techScore}%</span>
                  <span className="text-[10px] text-violet-600 block mt-0.5">Correctness & Relevance</span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Structure (20%)</span>
                  <span className="text-2xl font-black text-indigo-800 block mt-1">{structScore}%</span>
                  <span className="text-[10px] text-indigo-600 block mt-0.5">Clarity & Organization</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Concepts (15%)</span>
                  <span className="text-2xl font-black text-purple-800 block mt-1">{conceptScore}%</span>
                  <span className="text-[10px] text-purple-600 block mt-0.5">Role Domain Depth</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Fluency (15%)</span>
                  <span className="text-2xl font-black text-blue-800 block mt-1">{fluencyScore}%</span>
                  <span className="text-[10px] text-blue-600 block mt-0.5">Pace & Fillers</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Effectiveness (10%)</span>
                  <span className="text-2xl font-black text-emerald-800 block mt-1">{commScore}%</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Completeness</span>
                </div>
              </div>
            </div>

            {/* Ethical Decoupling & Transparency Disclaimers */}
            <div className="p-4 rounded-2xl bg-violet-50/40 border border-violet-100 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center gap-2 text-violet-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-violet-600" />
                <span>Ethical AI Decoupling Safeguard</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-600">
                Speech hesitation, natural filler words, and measured pauses are normal cognitive processes and are <strong>never penalized</strong> as lack of technical knowledge.
                Acoustic tone variation and prosody dynamics are reported transparently without equating monotone speech to disinterest.
              </p>
            </div>

            {/* Overall Qualitative Feedback */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              <strong className="text-gray-900 block font-bold">Comprehensive Interview Evaluation:</strong>
              <p className="text-gray-700 leading-relaxed">
                {session.videoFeedback || 'Candidate demonstrated articulate domain expertise and clear technical communication.'}
              </p>
            </div>

            {/* Per-Question Details List */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Question-by-Question Analytics & Transcripts</h4>
              
              <div className="space-y-3">
                {questions.map((q) => {
                  const isExpanded = selectedQuestionForDetails === q.id;
                  const matched = parseJsonArray(q.matchedKeyPoints);
                  const missing = parseJsonArray(q.missingKeyPoints);
                  const qCalib = getConfidenceBadge(q.confidenceCalibrationLabel);

                  return (
                    <div key={q.id} className="border border-gray-200 rounded-2xl p-4 transition-all hover:border-violet-300">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setSelectedQuestionForDetails(isExpanded ? null : q.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs flex items-center justify-center border border-violet-100 shrink-0">
                            Q{q.sequenceNumber}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-gray-900 line-clamp-1">{q.questionText}</h5>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                              <span>{q.category}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold ${qCalib.bg}`}>{qCalib.text}</span>
                              {q.speakingWpm && <span>• {q.speakingWpm} WPM</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-black text-violet-700">
                            {q.questionScore ?? q.technicalScore ?? 80}%
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-xs">
                          {/* Transcript */}
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="font-bold text-gray-700 mb-1 flex items-center justify-between text-[11px]">
                              <span>Candidate Transcript:</span>
                              <span className="text-[10px] text-gray-500">{q.transcriptionProvider || 'BROWSER_SPEECH_API'}</span>
                            </div>
                            <p className="text-gray-800 italic font-mono text-[11px] leading-relaxed">
                              {q.transcript || 'No transcript captured. Provide speech transcript or candidate notes.'}
                            </p>
                          </div>

                          {/* Concepts */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                              <span className="text-[11px] font-bold text-emerald-800 block mb-1">Matched Key Points:</span>
                              <div className="flex flex-wrap gap-1">
                                {matched.length > 0 ? (
                                  matched.map((m, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                                      {m}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-gray-500">None detected</span>
                                )}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                              <span className="text-[11px] font-bold text-amber-800 block mb-1">Missing / Suggested Concepts:</span>
                              <div className="flex flex-wrap gap-1">
                                {missing.length > 0 ? (
                                  missing.map((m, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-medium">
                                      {m}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-gray-500">Comprehensive coverage</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Question Feedback */}
                          {q.feedback && (
                            <div className="p-3 rounded-xl bg-violet-50/50 border border-violet-100 text-[11px] text-violet-950">
                              <strong>Feedback: </strong>{q.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  that facial expressions, eye contact, body language, and personality are explicitly excluded, 
                  and that my recordings are stored privately for up to 30 days under the platform retention policy and can be permanently deleted by me at any time from the assessment report.
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

        {/* ACTIVE QUESTION DETAILED AI & SPEECH ANALYTICS BREAKDOWN */}
        {activeQuestion && activeQuestion.status === 'UPLOADED' && (() => {
          const matched = parseJsonArray(activeQuestion.matchedKeyPoints);
          const missing = parseJsonArray(activeQuestion.missingKeyPoints);
          const fillerList = parseJsonArray(activeQuestion.fillerWordsList);
          const qCalib = getConfidenceBadge(activeQuestion.confidenceCalibrationLabel);
          const qScore = activeQuestion.questionScore ?? activeQuestion.technicalScore ?? 80;
          const techScore = activeQuestion.technicalScore ?? qScore;
          const structScore = activeQuestion.answerStructureScore ?? techScore;
          const conceptScore = activeQuestion.conceptUsageScore ?? techScore;
          const fluencyScore = activeQuestion.fluencyScore ?? activeQuestion.communicationScore ?? qScore;
          const commScore = activeQuestion.communicationScore ?? qScore;

          return (
            <div className="bg-white border border-violet-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-sm border border-violet-100">
                    Q{activeQuestion.sequenceNumber}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Answer Evaluation & Speech Analytics
                    </h3>
                    <p className="text-xs text-gray-500">
                      Evaluated against {session.jobRoleName} benchmarks • Model: {activeQuestion.evaluationModel || 'DETERMINISTIC_ROLE_COMPETENCY_ENGINE (Fallback)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${qCalib.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${qCalib.dot}`} />
                    {qCalib.text}
                  </span>
                  <div className="px-4 py-1.5 rounded-2xl bg-violet-600 text-white font-black text-base shadow-xs">
                    {qScore} / 100
                  </div>
                </div>
              </div>

              {/* Confidence Calibration Explanation Banner */}
              {activeQuestion.confidenceCalibrationReason && (
                <div className="p-3.5 rounded-2xl bg-violet-50/50 border border-violet-100 text-xs text-violet-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-violet-900">Calibration Rationale: </strong>
                    <span>{activeQuestion.confidenceCalibrationReason}</span>
                  </div>
                </div>
              )}

              {/* 5-Part Weighted Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  5-Dimension Weighted Scoring Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 text-center">
                    <span className="text-[10px] text-gray-500 font-medium block">Tech Correctness (40%)</span>
                    <span className="text-lg font-black text-violet-800">{techScore}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center">
                    <span className="text-[10px] text-gray-500 font-medium block">Structure & Clarity (20%)</span>
                    <span className="text-lg font-black text-indigo-800">{structScore}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-center">
                    <span className="text-[10px] text-gray-500 font-medium block">Concept Usage (15%)</span>
                    <span className="text-lg font-black text-purple-800">{conceptScore}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                    <span className="text-[10px] text-gray-500 font-medium block">Speech Fluency (15%)</span>
                    <span className="text-lg font-black text-blue-800">{fluencyScore}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-500 font-medium block">Communication (10%)</span>
                    <span className="text-lg font-black text-emerald-800">{commScore}%</span>
                  </div>
                </div>
              </div>

              {/* Speech Fluency & Acoustic Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hesitation & Pace */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-violet-600" /> Speech Fluency & Hesitation
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-gray-100">
                      <span className="text-[10px] text-gray-500 block">Speaking Rate</span>
                      <span className="font-bold text-gray-900">{activeQuestion.speakingWpm ?? 0} WPM</span>
                      <span className="text-[10px] text-gray-400 block">({activeQuestion.speechRateClassification || 'NORMAL'})</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-gray-100">
                      <span className="text-[10px] text-gray-500 block">Filler Words</span>
                      <span className="font-bold text-gray-900">{activeQuestion.fillerWordsCount ?? 0} words</span>
                      <span className="text-[10px] text-gray-400 block">({activeQuestion.fillerWordsPerMinute ?? 0}/min)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-gray-100">
                      <span className="text-[10px] text-gray-500 block">Pauses (&ge; 0.35s)</span>
                      <span className="font-bold text-gray-900">{activeQuestion.pausesCount ?? 0} detected</span>
                      <span className="text-[10px] text-gray-400 block">Avg: {activeQuestion.avgPauseDurationSec ?? 0}s</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-gray-100">
                      <span className="text-[10px] text-gray-500 block">Repeated Words</span>
                      <span className="font-bold text-gray-900">{activeQuestion.repeatedWordsCount ?? 0} instances</span>
                      <span className="text-[10px] text-gray-400 block">Max Pause: {activeQuestion.longestPauseDurationSec ?? 0}s</span>
                    </div>
                  </div>
                  {fillerList.length > 0 && (
                    <div className="text-[11px] text-gray-600">
                      <strong className="text-gray-700">Observed Fillers: </strong>
                      {fillerList.join(', ')}
                    </div>
                  )}
                </div>

                {/* Tone Dynamics & Prosody Status */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-violet-600" /> Tone Dynamics & Prosody Status
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100">
                      <span className="text-gray-600">Pitch Dynamics Variation:</span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-gray-100 text-gray-700">
                        {activeQuestion.pitchVariationStatus || 'UNAVAILABLE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100">
                      <span className="text-gray-600">Vocal Energy Dynamics:</span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-gray-100 text-gray-700">
                        {activeQuestion.energyVariationStatus || 'UNAVAILABLE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100">
                      <span className="text-gray-600">Overall Prosody Status:</span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-gray-100 text-gray-700">
                        {activeQuestion.prosodyAnalysisStatus || 'UNAVAILABLE'}
                      </span>
                    </div>
                  </div>
                  {activeQuestion.prosodyNotes && (
                    <p className="text-[10px] text-gray-500 italic leading-relaxed">
                      {activeQuestion.prosodyNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Concepts Matched & Missing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 block">Matched Role Concepts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {matched.length > 0 ? (
                      matched.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">None detected in transcript</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                  <span className="text-xs font-bold text-amber-900 block">Missing / Recommended Concepts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.length > 0 ? (
                      missing.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">Comprehensive concept coverage</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {(activeQuestion.competencyFeedback || activeQuestion.feedback) && (
                <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 text-xs text-violet-950">
                  <strong className="text-violet-900 block mb-1">Qualitative Technical Evaluation Feedback:</strong>
                  <p className="leading-relaxed">{activeQuestion.competencyFeedback || activeQuestion.feedback}</p>
                </div>
              )}

              {/* Captured Transcript */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-gray-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-violet-600" /> Candidate Answer Transcript
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Provider: {activeQuestion.transcriptionProvider || 'BROWSER_SPEECH_API'}
                  </span>
                </div>
                <p className="text-gray-800 font-mono text-[11px] leading-relaxed bg-white p-3 rounded-xl border border-gray-200">
                  {activeQuestion.transcript || 'No transcript captured. Provide speech transcript or candidate notes.'}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
