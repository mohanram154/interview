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
  videoSentimentLabel?: string;
  videoFeedback?: string;
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

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateAssessmentSessionPayload {
  jobRoleId: number;
  difficulty?: string;
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
