export interface JobRole {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface Evaluation {
  id: number;
  technicalAccuracyScore: number;
  relevanceScore: number;
  completenessScore: number;
  clarityScore: number;
  overallScore: number;
  sentimentLabel?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  sentimentConfidence?: number;
  feedback: string;
  strengths: string;
  improvements: string;
  evaluationStatus: string;
}

export interface Answer {
  id: number;
  interviewQuestionId: number;
  answerText: string;
  answerStatus: string;
  submittedAt: string;
  evaluation?: Evaluation;
}

export type AnswerResponse = Answer;

export interface InterviewQuestion {
  id: number;
  sequenceNumber: number;
  questionText: string;
  category: string;
  difficulty: string;
  answered: boolean;
  answer?: Answer;
}

export interface Interview {
  id: number;
  userId: number;
  jobRoleId: number;
  jobRoleName: string;
  difficulty: string;
  mode: 'TEXT' | 'VOICE';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  totalQuestions: number;
  answeredQuestionsCount: number;
  startedAt: string;
  completedAt?: string;
  questions?: InterviewQuestion[];
}

export interface Report {
  id: number;
  interviewId: number;
  jobRoleName: string;
  difficulty: string;
  mode: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  reportStatus: string;
  createdAt: string;
  questions?: InterviewQuestion[];
}

export interface DashboardStats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  recentInterviews: Interview[];
}

export interface CreateInterviewPayload {
  jobRoleId: number;
  difficulty: string;
  mode: 'TEXT' | 'VOICE';
  questionCount: number;
}
