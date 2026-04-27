
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { JobsList } from './pages/student/JobsList';
import { StudentProfile } from './pages/student/StudentProfile';
import { SettingsPage } from './pages/student/SettingsPage';
import { AddProject } from './pages/student/AddProject';
import { JobApplication } from './pages/student/JobApplication';
import { StudentApplications } from './pages/student/StudentApplications';
import { StudentNotifications } from './pages/student/StudentNotifications';
import { TpoAnnouncements } from './pages/tpo/TpoAnnouncements';
import { TpoJobs } from './pages/tpo/TpoJobs';
import { TpoStudents } from './pages/tpo/TpoStudents';
import { TpoDashboard } from './pages/tpo/TpoDashboard';
import { TpoCompanies } from './pages/tpo/TpoCompanies';
import { UserRole } from './types';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const search = roles ? `?role=${roles[0]}` : '';
    return <Navigate to={`/login${search}`} state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 transition-all duration-300 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const Unauthorized: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-6 text-center">
    <div className="glass p-12 rounded-3xl max-w-md shadow-2xl border border-red-100">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShieldAlert size={40} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
      <p className="text-gray-500 mb-8 font-medium">You do not have the required permissions to view this portal.</p>
      <button
        onClick={() => window.location.hash = '#/'}
        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors"
      >
        Return Home
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student Portal */}
          <Route path="/student/*" element={
            <ProtectedRoute roles={[UserRole.STUDENT]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="jobs" element={<JobsList />} />
                  <Route path="jobs/:id/apply" element={<JobApplication />} />
                  <Route path="applications" element={<StudentApplications />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="projects/add" element={<AddProject />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* TPO Portal */}
          <Route path="/tpo/*" element={
            <ProtectedRoute roles={[UserRole.TPO]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<TpoDashboard />} />
                  <Route path="students" element={<TpoStudents />} />
                  <Route path="jobs" element={<TpoJobs />} />
                  <Route path="companies" element={<TpoCompanies />} />
                  <Route path="announcements" element={<TpoAnnouncements />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Manager Portal */}
          <Route path="/manager/*" element={
            <ProtectedRoute roles={[UserRole.MANAGER]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<div className="p-10 text-center glass rounded-3xl font-bold text-gray-400">Global System Overview Coming Soon</div>} />
                  <Route path="tpos" element={<div className="p-10 text-center glass rounded-3xl font-bold text-gray-400">TPO Access Management Coming Soon</div>} />
                  <Route path="settings" element={<div className="p-10 text-center glass rounded-3xl font-bold text-gray-400">System Parameters Coming Soon</div>} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
