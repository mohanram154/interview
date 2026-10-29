import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, AuthResponse, ApiResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient.get<ApiResponse<User>>('/auth/me');
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out', err);
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, []);

  const handleAuthSuccess = (authData: AuthResponse) => {
    localStorage.setItem('auth_token', authData.token);
    setToken(authData.token);
    setUser(authData.user);
    setError(null);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      handleAuthSuccess(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', { name, email, password });
      handleAuthSuccess(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Email may already be in use.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/google', { idToken });
      handleAuthSuccess(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Google authentication failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    try {
      apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        register,
        loginWithGoogle,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
