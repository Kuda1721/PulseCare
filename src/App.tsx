import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientDetail } from './pages/PatientDetail';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';
import { Devices } from './pages/Devices';
import { Monitor } from './pages/Monitor';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { LoadingScreen } from './pages/LoadingScreen';
import { Login } from './pages/Login';
import { useAuth } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadComplete = () => {
    setLoaded(true);
    setTimeout(() => setShowLoading(false), 700);
  };

  return (
    <BrowserRouter>
      {showLoading && <LoadingScreen onComplete={handleLoadComplete} />}
      <div className={`h-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
