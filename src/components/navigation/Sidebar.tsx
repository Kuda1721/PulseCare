import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Activity, Bell, BarChart3,
  Cpu, FileText, Settings, HelpCircle, X, ChevronRight
} from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useAuth } from '../../store/authStore';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/patients',  icon: Users,           label: 'Patients' },
  { to: '/monitor',   icon: Activity,         label: 'Live Monitor' },
  { to: '/alerts',    icon: Bell,             label: 'Alerts', badge: true },
  { to: '/analytics', icon: BarChart3,        label: 'Analytics' },
  { to: '/devices',   icon: Cpu,              label: 'Devices' },
  { to: '/reports',   icon: FileText,         label: 'Reports' },
];

interface Props { open: boolean; onClose: () => void; }

export function Sidebar({ open, onClose }: Props) {
  const { alerts } = usePatientStore();
  const { doctor, logout } = useAuth();
  const location = useLocation();
  const critCount = alerts.filter(a => !a.acknowledged && !a.resolved).length;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose} />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        w-[250px] border-r border-white/[0.06]
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}
        style={{ background: 'linear-gradient(180deg, #0B1728 0%, #08131f 100%)' }}>

        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <PulseLogo />
            <div>
              <div className="text-white font-bold text-sm tracking-wider">PULSECARE</div>
              <div className="text-[#718198] text-[9px] tracking-[0.14em] uppercase font-medium mt-0.5">Remote Monitoring</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-[#718198] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, badge }) => {
            const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            return (
              <NavLink key={to} to={to} onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-[#A7B5C7] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}>
                {active && (
                  <motion.div layoutId="sidebar-indicator"
                    className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 40 }} />
                )}
                <div className="flex items-center gap-3 pl-1.5">
                  <Icon size={15} strokeWidth={active ? 2 : 1.7} />
                  {label}
                </div>
                <div className="flex items-center gap-1.5">
                  {badge && critCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                      {critCount}
                    </span>
                  )}
                  <ChevronRight size={11} className={`transition-all ${active ? 'opacity-40' : 'opacity-0 group-hover:opacity-30'}`} />
                </div>
              </NavLink>
            );
          })}

          <div className="h-px bg-white/[0.05] my-3 mx-1" />

          {[
            { to: '/settings', icon: Settings, label: 'Settings' },
          ].map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <NavLink key={to} to={to} onClick={onClose}
                className={`flex items-center gap-3 pl-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-cyan-500/10 text-cyan-400' : 'text-[#718198] hover:text-white hover:bg-white/[0.04]'
                }`}>
                <Icon size={15} strokeWidth={1.7} />
                {label}
              </NavLink>
            );
          })}

          <a href="#" className="flex items-center gap-3 pl-4 px-3 py-2.5 rounded-xl text-sm font-medium text-[#718198] hover:text-white hover:bg-white/[0.04] transition-all">
            <HelpCircle size={15} strokeWidth={1.7} />
            Help & Support
          </a>
        </nav>

        {/* Doctor profile */}
        <div className="px-3 pb-5">
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3 hover:bg-white/[0.06] transition-all">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {doctor?.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-semibold truncate">{doctor?.name}</div>
              <div className="text-[#718198] text-[10px]">{doctor?.specialty}</div>
            </div>
            <button onClick={logout} className="text-[#718198] hover:text-white text-[10px]">Log out</button>
          </div>
        </div>
      </aside>
    </>
  );
}

function PulseLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="rgba(40,215,232,0.06)" />
      <circle cx="16" cy="16" r="15" stroke="#28D7E8" strokeWidth="1" opacity="0.35" />
      <path d="M4 16 L9 16 L11 10 L14 22 L17 13 L19 18 L21 16 L28 16"
        stroke="#28D7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
