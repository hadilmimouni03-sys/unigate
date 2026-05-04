import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';
import TimetablePage from './pages/timetable/TimetablePage';
import GradesPage from './pages/grades/GradesPage';
import SkillSwapPage from './pages/skillswap/SkillSwapPage';
import InternshipsPage from './pages/internship/InternshipsPage';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
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
          <Route path="/"         element={<RoleSelectionPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home"     element={<HomeRedirect />} />

          <Route path="/student"       element={withLayout(StudentDashboard, ['STUDENT'])} />
          <Route path="/admin"         element={withLayout(AdminDashboard,   ['ADMIN','SUPER_ADMIN'])} />
          <Route path="/timetable"     element={withLayout(TimetablePage,    null)} />
          <Route path="/grades"        element={withLayout(GradesPage,       null)} />
          <Route path="/skillswap"     element={withLayout(SkillSwapPage,    null)} />
          <Route path="/internships"   element={withLayout(InternshipsPage,  null)} />
          <Route path="/notifications" element={withLayout(NotificationsPage, null)} />

          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-xl font-semibold text-gray-700">Accès refusé</h1>
                <p className="mt-2 text-sm text-gray-500">Vous n'avez pas la permission d'accéder à cette page.</p>
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
