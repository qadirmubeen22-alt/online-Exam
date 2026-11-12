import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ExamBuilder } from './pages/ExamBuilder';
import { QuestionManager } from './pages/QuestionManager';
import { ResultReport } from './pages/ResultReport';
import { StudentLobby } from './pages/StudentLobby';
import { StudentExamRoom } from './pages/StudentExamRoom';
import { StudentResult } from './pages/StudentResult';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student/lobby'} replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Student Routes */}
              <Route
                path="/student/lobby"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher']}>
                    <StudentLobby />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/take/:examId"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher']}>
                    <StudentExamRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/result/:submissionId"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher']}>
                    <StudentResult />
                  </ProtectedRoute>
                }
              />

              {/* Teacher Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/create-exam"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <ExamBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/exam/:id/questions"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <QuestionManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/exam/:id/results"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <ResultReport />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
