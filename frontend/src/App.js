import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';
import TimetablePage from './pages/timetable/TimetablePage';
import GradesPage from './pages/grades/GradesPage';
import SkillSwapPage from './pages/skillswap/SkillSwapPage';
import InternshipsPage from './pages/internship/InternshipsPage';
import GradeConfigPage from './pages/admin/GradeConfigPage';
import EligibilityRulesPage from './pages/admin/EligibilityRulesPage';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  return <Navigate to="/admin" replace />;
};

const withLayout = (Component, roles) => (
  <ProtectedRoute roles={roles}>
    <Layout><Component /></Layout>
  </ProtectedRoute>
);

const App = () => (
  <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<LoginPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home"     element={<HomeRedirect />} />

          <Route path="/student"            element={withLayout(StudentDashboard,    ['STUDENT'])} />
          <Route path="/admin"              element={withLayout(AdminDashboard,      ['ADMIN','SUPER_ADMIN'])} />
          <Route path="/admin/grade-config" element={withLayout(GradeConfigPage,     ['ADMIN','SUPER_ADMIN'])} />
          <Route path="/admin/eligibility"  element={withLayout(EligibilityRulesPage,['ADMIN','SUPER_ADMIN'])} />
          <Route path="/timetable"          element={withLayout(TimetablePage,       null)} />
          <Route path="/grades"             element={withLayout(GradesPage,          null)} />
          <Route path="/skillswap"          element={withLayout(SkillSwapPage,       null)} />
          <Route path="/internships"        element={withLayout(InternshipsPage,     null)} />
          <Route path="/notifications"      element={withLayout(NotificationsPage,   null)} />

          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/>
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-slate-800">Access Denied</h1>
                <p className="mt-2 text-sm text-slate-500">You do not have permission to access this page.</p>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
);

export default App;
