export type AssessmentStage = 
  | 'RESUME_EVALUATION' 
  | 'MCQ_ASSESSMENT' 
  | 'VIDEO_INTERVIEW' 
  | 'COMPLETED';

export type StageStatus = 
  | 'LOCKED' 
  | 'AVAILABLE' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'FAILED'
  | 'NOT_STARTED';

export interface RoundDetail {
  stageKey: string;
  title: string;
  description: string;
  roundNumber: number;
  status: StageStatus;
  unlocked: boolean;
  lockMessage?: string;
  score?: number;
  completedAt?: string;
  actionLabel: string;
  actionRoute: string;
}

export interface AssessmentSession {
  id: number;
  userId: number;
  jobRoleId: number;
  jobRoleName: string;
  difficulty: string;
  questionCount?: number;
  currentStage: AssessmentStage;
  sessionStatus: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

  // Stage 1: Resume
  resumeStageStatus: StageStatus;
  resumeScore?: number;
  resumeFilename?: string;
  resumeSkillsMatchScore?: number;
  resumeExperienceScore?: number;
  resumeFeedback?: string;
  resumeCompletedAt?: string;
  resumeUnlocked: boolean;

  // Stage 2: MCQ
  mcqStageStatus: StageStatus;
  mcqInterviewId?: number;
  mcqScore?: number;
  mcqCompletedAt?: string;
  mcqUnlocked: boolean;

  // Stage 3: Video
  videoStageStatus: StageStatus;
  videoScore?: number;
  videoTechnicalScore?: number;
  videoCommunicationScore?: number;
  videoFluencyScore?: number;
  videoAnswerStructureScore?: number;
  videoConceptUsageScore?: number;
  videoConfidenceCalibrationLabel?: string;
  videoSentimentLabel?: string;
  videoFeedback?: string;
  videoConsentGivenAt?: string;
  videoCompletedAt?: string;
  videoUnlocked: boolean;

  // Final Outcome
  finalCompositeScore?: number;
  finalSummary?: string;
  finalReportUnlocked: boolean;

  progressText?: string;
  activeRoundNumber?: number;
  resumeRound?: RoundDetail;
  mcqRound?: RoundDetail;
  videoRound?: RoundDetail;

  recordingsRetentionExpiresAt?: string;
  recordingsDeletedAt?: string;
  recordingsDeletedByUser?: boolean;

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateAssessmentSessionPayload {
  jobRoleId: number;
  difficulty?: string;
  questionCount?: number;
}

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  gpaOrScore?: string;
}

export interface ProjectEntry {
  title: string;
  technologies?: string;
  description: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface TechnicalSkillsData {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  toolsAndPlatforms: string[];
}

export interface ParsedResumeData {
  filename: string;
  fileType: string;
  rawTextLength?: number;
  contactDetails: ContactDetails;
  summary: string;
  education: EducationEntry[] | string;
  technicalSkills: TechnicalSkillsData;
  projects: ProjectEntry[] | string;
  experience: ExperienceEntry[] | string;
  certifications: string[] | string;
  evidencedSkills?: Record<string, string[]>;
}

export interface MatchedSkillItem {
  skill: string;
  category: string;
  evidencedInProjects: boolean;
  evidenceNotes: string;
}

export interface MissingSkillItem {
  skill: string;
  category: string;
  importance: string;
}

export interface RelevantProjectItem {
  title: string;
  matchedTechnologies: string[];
  relevanceScore: number;
  description?: string;
}

export interface ScoreExplanationItem {
  score: number;
  weight: string;
  explanation: string;
}

export interface ResumeEvaluationResult {
  id: number;
  assessmentSessionId: number;
  targetRole: string;
  companyName?: string;
  customJobDescription: boolean;
  resumeFilename: string;
  resumeFileType: string;
  resumeFileSize: number;

  overallMatchScore: number;
  technicalSkillScore: number;
  projectExperienceScore: number;
  internshipWorkScore: number;
  educationCertScore: number;
  practicalEvidenceScore: number;
  roleAlignmentScore: number;

  matchedSkills: MatchedSkillItem[];
  missingSkills: MissingSkillItem[];
  relevantProjects: RelevantProjectItem[];
  strengths: string[];
  requirementsNotEvidenced: string[];
  improvementSuggestions: string[];
  scoreExplanations: Record<string, ScoreExplanationItem>;

  extractedData?: ParsedResumeData;
  correctedData?: ParsedResumeData;

  evaluationBenchmark: string;
  benchmarkNote: string;
  completedAt: string;
}

export interface VideoQuestion {
  id: number;
  assessmentSessionId: number;
  sequenceNumber: number;
  questionText: string;
  category: string;
  tailoredSource?: string;
  status: 'PENDING' | 'RECORDED' | 'UPLOADED';
  hasRecording: boolean;
  recordingDurationSeconds?: number;
  recordingFileSize?: number;
  recordingMimeType?: string;

  // Transcription
  transcript?: string;
  transcriptionStatus?: string;
  transcriptionProvider?: string;
  transcriptionNotes?: string;
  wordTimestamps?: string;

  // Fluency & Hesitation
  fillerWordsCount?: number;
  fillerWordRate?: number;
  fillerWordsPerMinute?: number;
  fillerWordsList?: string;
  pauseCount?: number;
  pausesCount?: number;
  avgPauseDuration?: number;
  avgPauseDurationSec?: number;
  longestPauseDuration?: number;
  longestPauseDurationSec?: number;
  repeatedWordsCount?: number;
  fluencyScore?: number;
  fluencyNotes?: string;
  speechClarityLevel?: string;

  // Prosody & Tone
  prosodyStatus?: string;
  prosodyAnalysisStatus?: string;
  pitchVariation?: number;
  pitchVariationStatus?: string;
  vocalEnergyVariation?: number;
  energyVariationStatus?: string;
  speechRhythmScore?: number;
  prosodyNotes?: string;

  // Speech Rate & Sentiment
  speakingWpm?: number;
  totalWpm?: number;
  speechRateClassification?: string;
  sentimentLabel?: string;
  sentimentReliability?: string;
  sentimentReliabilityRating?: string;
  vocalIntensity?: string;

  // Technical Competency
  technicalScore?: number;
  answerStructureScore?: number;
  communicationScore?: number;
  relevanceScore?: number;
  completenessScore?: number;
  conceptUsageScore?: number;
  matchedKeyPoints?: string;
  missingKeyPoints?: string;
  evaluatorModel?: string;
  evaluationModel?: string;
  feedback?: string;
  competencyFeedback?: string;
  improvementSuggestions?: string;

  // Confidence Calibration
  linguisticConfidenceScore?: number;
  confidenceCalibrationLabel?: 'CALIBRATED' | 'POSSIBLE_OVERCONFIDENCE' | 'POSSIBLE_UNDERCONFIDENCE' | string;
  confidenceDelta?: number;
  confidenceCalibrationExplanation?: string;
  confidenceCalibrationReason?: string;

  // Composite Question Score
  questionScore?: number;

  uploadedAt?: string;
}

export interface VideoInterviewStatus {
  sessionId: number;
  jobRoleName: string;
  difficulty: string;
  stageStatus: StageStatus;
  consentGiven: boolean;
  consentGivenAt?: string;
  totalQuestions: number;
  uploadedQuestions: number;
  allQuestionsUploaded: boolean;
  questions: VideoQuestion[];
}

export interface ResumeScorecardData {
  status: 'COMPLETED' | 'INCOMPLETE';
  score?: number;
  weight: number;
  targetRole?: string;
  companyName?: string;
  jobDescription?: string;
  filename?: string;
  feedback?: string;
  scoringBreakdown?: {
    technicalSkillScore?: number;
    projectExperienceScore?: number;
    internshipWorkScore?: number;
    educationCertScore?: number;
    practicalEvidenceScore?: number;
    roleAlignmentScore?: number;
    scoreExplanations?: Record<string, any>;
  };
  matchedSkills?: Array<{
    skill: string;
    category: string;
    evidencedInProjects?: boolean;
    evidenceNotes?: string;
  }>;
  missingSkills?: Array<{
    skill: string;
    category: string;
    importance: string;
  }>;
  relevantProjects?: Array<{
    title: string;
    matchedTechnologies: string[];
    relevanceScore: number;
    description?: string;
  }>;
  strengths?: string[];
  recommendations?: string[];
}

export interface McqQuestionReviewItem {
  sequenceNumber: number;
  questionText: string;
  category: string;
  options: string[];
  selectedOption?: string;
  correctOption: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface McqTopicPerformanceItem {
  topic: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface McqScorecardData {
  status: 'COMPLETED' | 'INCOMPLETE';
  score?: number;
  percentage?: number;
  weight: number;
  totalQuestionsCount?: number;
  correctAnswersCount?: number;
  incorrectAnswersCount?: number;
  unansweredCount?: number;
  topicWisePerformance?: McqTopicPerformanceItem[];
  questions?: McqQuestionReviewItem[];
  learningGaps?: string[];
}

export interface VideoQuestionReviewItem {
  sequenceNumber: number;
  questionText: string;
  category: string;
  questionScore?: number;
  technicalScore?: number;
  conceptUsageScore?: number;
  fluencyScore?: number;
  transcript?: string;
  feedback?: string;
  confidenceCalibrationLabel?: string;
  confidenceCalibrationExplanation?: string;
  prosodyStatus?: string;
  prosodyNotes?: string;
  matchedKeyPoints?: string[];
  missingKeyPoints?: string[];
}

export interface VideoScorecardData {
  status: 'COMPLETED' | 'INCOMPLETE';
  score?: number;
  weight: number;
  totalQuestions?: number;
  technicalAnswerQualityBreakdown?: {
    technicalCorrectness: number;
    answerStructureClarity: number;
    roleConceptUsage: number;
    speechFluency: number;
    communicationEffectiveness: number;
  };
  hesitationAndFluencyMetrics?: {
    totalFillerWordsCount: number;
    totalPauseCount: number;
    totalRepeatedWordsCount: number;
    fluencyScore: number;
    speechClarityLevel: string;
    ethicalDisclaimer?: string;
  };
  speechRate?: {
    averageSpeakingWpm: number;
    speechRateClassification: string;
  };
  prosodyAndMeasurements?: {
    prosodyStatus: string;
    pitchVariationStatus: string;
    energyVariationStatus: string;
    prosodyNotes: string;
  };
  sentimentAndIntensity?: {
    sentimentLabel: string;
    sentimentReliability: string;
    vocalIntensity: string;
  };
  confidenceCalibration?: {
    dominantLabel: string;
    explanation: string;
  };
  questions?: VideoQuestionReviewItem[];
}

export interface LearningRoadmapPhase {
  phase: string;
  duration: string;
  focus: string;
  actions: string[];
}

export interface AssessmentReport {
  id?: number;
  assessmentSessionId: number;
  jobRoleName: string;
  difficulty: string;
  status: 'COMPLETED' | 'INCOMPLETE';
  incompleteReason?: string;
  createdAt?: string;
  updatedAt?: string;

  // Weights & Formula
  resumeWeight: number;
  mcqWeight: number;
  videoWeight: number;
  formulaText: string;

  // Scores
  overallScore?: number;
  resumeScore?: number;
  mcqScore?: number;
  videoScore?: number;

  // Scorecards
  resumeCard?: ResumeScorecardData;
  mcqCard?: McqScorecardData;
  videoCard?: VideoScorecardData;

  // Insights
  overallStrengths?: string[];
  overallSkillGaps?: string[];
  learningRoadmap?: LearningRoadmapPhase[];
  disclaimer: string;
}

export interface ReportHistoryItem {
  id: number;
  assessmentSessionId: number;
  jobRoleName: string;
  difficulty: string;
  status: string;
  overallScore?: number;
  resumeScore?: number;
  mcqScore?: number;
  videoScore?: number;
  recordingsRetentionExpiresAt?: string;
  recordingsDeletedAt?: string;
  recordingsDeletedByUser?: boolean;

  createdAt: string;
}
