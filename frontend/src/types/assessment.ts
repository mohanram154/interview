export type AssessmentStage = 
  | 'RESUME_EVALUATION' 
  | 'MCQ_ASSESSMENT' 
  | 'VIDEO_INTERVIEW' 
  | 'COMPLETED';

export type StageStatus = 
  | 'LOCKED' 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED';

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

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateAssessmentSessionPayload {
  jobRoleId: number;
  difficulty?: string;
}
