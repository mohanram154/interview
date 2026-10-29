import { apiClient } from './client';
import { 
  AssessmentSession, 
  CreateAssessmentSessionPayload, 
  ParsedResumeData, 
  ResumeEvaluationResult 
} from '../types/assessment';

export const assessmentApi = {
  createSession: async (payload: CreateAssessmentSessionPayload): Promise<AssessmentSession> => {
    const res = await apiClient.post<{ data: AssessmentSession }>('/assessment-sessions', payload);
    return res.data.data;
  },

  getSession: async (sessionId: number | string): Promise<AssessmentSession> => {
    const res = await apiClient.get<{ data: AssessmentSession }>(`/assessment-sessions/${sessionId}`);
    return res.data.data;
  },

  getActiveSession: async (): Promise<AssessmentSession | null> => {
    try {
      const res = await apiClient.get<{ data: AssessmentSession | null }>('/assessment-sessions/active');
      return res.data.data;
    } catch {
      return null;
    }
  },

  getUserSessions: async (): Promise<AssessmentSession[]> => {
    const res = await apiClient.get<{ data: AssessmentSession[] }>('/assessment-sessions');
    return res.data.data;
  },

  validateStageAccess: async (sessionId: number | string, stage: string): Promise<boolean> => {
    const res = await apiClient.get<{ data: boolean }>(`/assessment-sessions/${sessionId}/validate-stage?stage=${encodeURIComponent(stage)}`);
    return res.data.data;
  },

  // Upload and parse resume file (PDF or DOCX)
  uploadAndParseResume: async (
    sessionId: number | string,
    file: File,
    targetRole?: string
  ): Promise<{ filename: string; fileType: string; fileSize: number; extractedData: ParsedResumeData }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (targetRole) {
      formData.append('targetRole', targetRole);
    }
    const res = await apiClient.post<{ data: { filename: string; fileType: string; fileSize: number; extractedData: ParsedResumeData } }>(
      `/assessment-sessions/${sessionId}/resume/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      }
    );
    return res.data.data;
  },

  // Submit candidate-reviewed/corrected resume data for final scoring and MCQ unlock
  submitResumeEvaluation: async (
    sessionId: number | string,
    payload: {
      targetRole: string;
      companyName?: string;
      jobDescription?: string;
      correctedData: ParsedResumeData;
      customWeights?: Record<string, number>;
    }
  ): Promise<ResumeEvaluationResult> => {
    const res = await apiClient.post<{ data: ResumeEvaluationResult }>(
      `/assessment-sessions/${sessionId}/resume/evaluate`,
      payload
    );
    return res.data.data;
  },

  // Get persisted resume evaluation details
  getResumeEvaluation: async (sessionId: number | string): Promise<ResumeEvaluationResult> => {
    const res = await apiClient.get<{ data: ResumeEvaluationResult }>(
      `/assessment-sessions/${sessionId}/resume`
    );
    return res.data.data;
  },

  startResumeRound: async (sessionId: number | string): Promise<AssessmentSession> => {
    const res = await apiClient.put<{ data: AssessmentSession }>(`/assessment-sessions/${sessionId}/resume/start`);
    return res.data.data;
  },

  completeResumeRound: async (
    sessionId: number | string,
    payload: {
      score: number;
      skillsMatchScore?: number;
      experienceScore?: number;
      feedback?: string;
      filename?: string;
    }
  ): Promise<AssessmentSession> => {
    const res = await apiClient.post<{ data: AssessmentSession }>(`/assessment-sessions/${sessionId}/resume/complete`, payload);
    return res.data.data;
  },

  startOrResumeMcqRound: async (sessionId: number | string, questionCount?: number): Promise<any> => {
    const url = questionCount
      ? `/assessment-sessions/${sessionId}/mcq/start?questionCount=${questionCount}`
      : `/assessment-sessions/${sessionId}/mcq/start`;
    const res = await apiClient.post<{ data: any }>(url);
    return res.data.data;
  },

  completeMcqRound: async (
    sessionId: number | string,
    payload?: {
      mcqInterviewId?: number;
      score?: number;
    }
  ): Promise<AssessmentSession> => {
    const res = await apiClient.post<{ data: AssessmentSession }>(`/assessment-sessions/${sessionId}/mcq/complete`, payload || {});
    return res.data.data;
  },

  startOrResumeVideoRound: async (sessionId: number | string): Promise<AssessmentSession> => {
    const res = await apiClient.post<{ data: AssessmentSession }>(`/assessment-sessions/${sessionId}/video/start`);
    return res.data.data;
  },

  completeVideoRound: async (
    sessionId: number | string,
    payload: {
      score: number;
      technicalScore?: number;
      communicationScore?: number;
      sentimentLabel?: string;
      feedback?: string;
    }
  ): Promise<AssessmentSession> => {
    const res = await apiClient.post<{ data: AssessmentSession }>(`/assessment-sessions/${sessionId}/video/complete`, payload);
    return res.data.data;
  },

  getFinalReport: async (sessionId: number | string): Promise<AssessmentSession> => {
    const res = await apiClient.get<{ data: AssessmentSession }>(`/assessment-sessions/${sessionId}/report`);
    return res.data.data;
  },
};
