import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import { AppDataProvider } from './context/AppDataContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import TeacherForm from './pages/TeacherForm';
import Classes from './pages/Classes';
import Enrollments from './pages/Enrollments';
import EnrollmentForm from './pages/EnrollmentForm';
import Payments from './pages/Payments';
import Grades from './pages/Grades';
import Schedule from './pages/Schedule';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Cartes from './pages/Cartes';

const ProtectedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f3ee' }}>
      <div style={{ fontSize: 14, color: '#78716c' }}>Chargement...</div>
    </div>;
  }

  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          user ? (
            <AppDataProvider>
              <Layout>
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
