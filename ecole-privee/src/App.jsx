import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SchoolProvider } from './context/SchoolContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Enrollments from './pages/Enrollments';
import Payments from './pages/Payments';
import Grades from './pages/Grades';
import Schedule from './pages/Schedule';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Register from './pages/Register';

const ProtectedApp = () => {
  const { currentUser } = useAppData();

  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          currentUser ? (
            <Layout>
              <Routes>
                <Route path="/dashboard"     element={<Dashboard />}     />
                <Route path="/students"      element={<Students />}      />
                <Route path="/teachers"      element={<Teachers />}      />
                <Route path="/classes"       element={<Classes />}       />
                <Route path="/enrollments"   element={<Enrollments />}   />
                <Route path="/payments"      element={<Payments />}      />
                <Route path="/grades"        element={<Grades />}        />
                <Route path="/schedule"      element={<Schedule />}      />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/reports"       element={<Reports />}       />
                <Route path="/settings"      element={<Settings />}      />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
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
    <AppDataProvider>
      <SchoolProvider>
        <Router>
          <ProtectedApp />
        </Router>
      </SchoolProvider>
    </AppDataProvider>
  );
}

export default App;
