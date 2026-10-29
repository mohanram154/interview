export interface CandidateProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  education?: string;
  degree?: string;
  specialization?: string;
  skills?: string;
  experienceYears: number;
  preferredRole?: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  education?: string;
  degree?: string;
  specialization?: string;
  skills?: string;
  experienceYears: number;
  preferredRole?: string;
}

