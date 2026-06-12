import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import { AppDataProvider } from './context/AppDataContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Teachers = lazy(() => import('./pages/Teachers'));
const TeacherForm = lazy(() => import('./pages/TeacherForm'));
const Classes = lazy(() => import('./pages/Classes'));
const Enrollments = lazy(() => import('./pages/Enrollments'));
const EnrollmentForm = lazy(() => import('./pages/EnrollmentForm'));
const Payments = lazy(() => import('./pages/Payments'));
const Grades = lazy(() => import('./pages/Grades'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Cartes = lazy(() => import('./pages/Cartes'));

const PageLoading = () => (
  <div className="page-loading">
    <i className="fa-solid fa-spinner fa-spin"></i> Chargement...
  </div>
);

const ProtectedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f3ee' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 18, color: '#78716c', marginRight: 10 }}></i>
      <div style={{ fontSize: 14, color: '#78716c' }}>Chargement...</div>
    </div>;
  }

  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<PageLoading />}>
          <Login />
        </Suspense>
      } />
      <Route path="/forgot-password" element={
        <Suspense fallback={<PageLoading />}>
          <ForgotPassword />
        </Suspense>
      } />
      <Route
        path="/*"
        element={
          user ? (
            <AppDataProvider>
              <Layout>
                <Suspense fallback={<PageLoading />}>
                  <Routes>
                    <Route path="/dashboard"     element={<Dashboard />}     />
                    <Route path="/students"      element={<Students />}      />
                    <Route path="/teachers"      element={<Teachers />}      />
                    <Route path="/teachers/ajouter" element={<TeacherForm />} />
                    <Route path="/teachers/modifier/:id" element={<TeacherForm />} />
                    <Route path="/classes"       element={<Classes />}       />
                    <Route path="/enrollments"   element={<Enrollments />}   />
                    <Route path="/enrollments/ajouter" element={<EnrollmentForm mode="ajouter" />} />
                    <Route path="/enrollments/reinscrire" element={<EnrollmentForm mode="reinscrire" />} />
                    <Route path="/payments"      element={<Payments />}      />
                    <Route path="/grades"        element={<Grades />}        />
                    <Route path="/schedule"      element={<Schedule />}      />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/reports"       element={<Reports />}       />
                    <Route path="/settings"      element={<Settings />}      />
                    <Route path="/profil"        element={<Profile />}       />
                    <Route path="/cartes"        element={<Cartes />}        />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </AppDataProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SchoolProvider>
          <Router>
            <ProtectedApp />
          </Router>
        </SchoolProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
