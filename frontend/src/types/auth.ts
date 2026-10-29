export interface User {
  id: number;
  name: string;
  email: string;
  authProvider: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
