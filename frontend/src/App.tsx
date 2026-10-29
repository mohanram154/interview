import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { InterviewSetupPage } from './pages/InterviewSetupPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { AssessmentHubPage } from './pages/AssessmentHubPage';
import { ResumeRoundPage } from './pages/ResumeRoundPage';
import { McqAssessmentPage } from './pages/McqAssessmentPage';
import { VideoInterviewRoundPage } from './pages/VideoInterviewRoundPage';
import { FinalReportPage } from './pages/FinalReportPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-white text-gray-800 font-sans selection:bg-violet-600 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Candidate Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/new"
                element={
                  <ProtectedRoute>
                    <InterviewSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id"
                element={
                  <ProtectedRoute>
                    <InterviewRoomPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id/report"
                element={
                  <ProtectedRoute>
                    <ReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Strict Sequential 3-Stage Assessment Routes */}
              <Route
                path="/assessment/:id"
                element={
                  <ProtectedRoute>
                    <AssessmentHubPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment/:id/resume"
                element={
                  <ProtectedRoute>
                    <ResumeRoundPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment/:id/mcq"
                element={
                  <ProtectedRoute>
                    <McqAssessmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment/:id/video"
                element={
                  <ProtectedRoute>
                    <VideoInterviewRoundPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment/:id/report"
                element={
                  <ProtectedRoute>
                    <FinalReportPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
export default App;
