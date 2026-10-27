import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '../navigation/Sidebar';
import { Topbar } from '../navigation/Topbar';
import { BottomNav } from '../navigation/BottomNav';
import { getVisibleAlerts, useRealtimeEngine } from '../../store/patientStore';
import { Toast } from '../ui/Toast';
import { getCurrentDoctor } from '../../store/authStore';
import { playUrgentAlarm } from '../../services/urgentAlarm';

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Good morning', subtitle: "Here's what's happening across your patients." },
  '/patients':  { title: 'Patients', subtitle: '20 patients currently registered' },
  '/monitor':   { title: 'Live Monitor', subtitle: 'Real-time patient vital monitoring' },
  '/alerts':    { title: 'Alert Center', subtitle: 'Manage and respond to patient alerts' },
  '/analytics': { title: 'Analytics', subtitle: 'Patient health trends and system performance' },
  '/devices':   { title: 'Connected Devices', subtitle: 'Wearable sensor status and management' },
  '/reports':   { title: 'Reports', subtitle: 'Generate and export clinical reports' },
  '/settings':  { title: 'Settings', subtitle: 'Configure PulseCare preferences' },
};

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pulsecare-theme') !== 'light');
  const [toast, setToast] = useState<{ id: number; message: string; type: string } | null>(null);
  const location = useLocation();
  const doctor = getCurrentDoctor();

  // Match patient detail route too
  const pathKey = Object.keys(TITLES).find(k => location.pathname.startsWith(k)) || location.pathname;
  const patientMatch = location.pathname.match(/^\/patients\/(.+)/);
  const page = patientMatch
    ? { title: 'Patient Profile', subtitle: 'Live monitoring and health summary' }
    : (TITLES[pathKey] || { title: 'PulseCare' });

  useRealtimeEngine(() => {
    if (!getVisibleAlerts().some(alert => alert.type === 'critical' && !alert.resolved)) return;
    setToast({ id: Date.now(), message: 'URGENT: Critical vital change requires immediate review', type: 'critical' });
    playUrgentAlarm();
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('pulsecare-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className={`flex h-full transition-colors duration-500 ${darkMode ? 'bg-[#07111F]' : 'bg-slate-50'}`}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={page.title === 'Good morning' && doctor ? `${page.title}, ${doctor.name}` : page.title}
          subtitle={page.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(v => !v)}
        />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="p-4 sm:p-6 h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />

      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type as any}
          onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
