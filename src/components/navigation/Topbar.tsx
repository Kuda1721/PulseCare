import { Search, Bell, Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePatientStore } from '../../store/patientStore';
import { useNavigate } from 'react-router-dom';
import { getCurrentDoctor } from '../../store/authStore';

interface Props {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Topbar({ title, subtitle, onMenuClick, darkMode, onToggleDark }: Props) {
  const { alerts } = usePatientStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const doctor = getCurrentDoctor();
  const unread = alerts.filter(a => !a.acknowledged && !a.resolved).length;

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] flex-shrink-0 relative z-20 bg-[#07111F]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-[#718198] hover:text-white transition-all">
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-white font-semibold text-sm leading-tight truncate max-w-[200px] sm:max-w-none">{title}</h1>
          {subtitle && <p className="text-[#718198] text-[11px] mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* System status — hidden on mobile */}
        <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-[#718198] border border-white/[0.05] rounded-full px-2.5 py-1.5 bg-green-500/5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          ALL SYSTEMS OPERATIONAL
        </div>

        {/* Search — hidden on small mobile */}
        <div className={`hidden sm:flex items-center gap-2 bg-white/[0.04] border rounded-xl px-3 py-1.5 w-44 lg:w-52 transition-all
          ${searchFocused ? 'border-cyan-500/40 shadow-[0_0_0_3px_rgba(40,215,232,0.06)] bg-cyan-500/5 w-52 lg:w-64' : 'border-white/[0.06]'}`}>
          <Search size={13} className="text-[#718198] flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="Search patients…"
            className="bg-transparent text-white text-xs placeholder-[#718198] outline-none w-full" />
        </div>

        {/* Notifications */}
        <div className="relative">
          <motion.button onClick={() => setShowNotifs(v => !v)} whileTap={{ scale: 0.92 }}
            className="relative p-2 rounded-xl hover:bg-white/5 text-[#A7B5C7] hover:text-white transition-all">
            <Bell size={17} strokeWidth={1.8} />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span key="badge"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div key="dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute right-0 top-full mt-2 w-80 bg-[#0B1728] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden origin-top-right">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">Notifications</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigate('/alerts'); setShowNotifs(false); }} className="text-cyan-400 text-xs hover:underline">View all</button>
                    <button onClick={() => setShowNotifs(false)} className="text-[#718198] hover:text-white p-0.5">
                      <X size={13} />
                    </button>
                  </div>
                </div>
                {alerts.filter(a => !a.resolved).slice(0, 5).length === 0 ? (
                  <div className="px-4 py-8 text-center text-[#718198] text-sm">No active alerts</div>
                ) : (
                  alerts.filter(a => !a.resolved).slice(0, 5).map(a => (
                    <div key={a.id}
                      onClick={() => { navigate(`/patients/${a.patientId}`); setShowNotifs(false); }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/[0.04] last:border-0 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'critical' ? 'bg-red-400' : a.type === 'high' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                      <div className="min-w-0">
                        <div className="text-white text-xs font-medium leading-snug">{a.message}</div>
                        <div className="text-[#718198] text-[10px] mt-0.5">{a.detail}</div>
                        <div className="text-[#718198] text-[10px] mt-1">{a.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <motion.button onClick={onToggleDark} whileTap={{ scale: 0.88, rotate: 20 }}
          className="p-2 rounded-xl hover:bg-white/5 text-[#A7B5C7] hover:text-white transition-all">
          {darkMode ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
        </motion.button>

        {/* Profile */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer hover:ring-2 hover:ring-cyan-500/30 transition-all">
          {doctor?.initials}
        </div>
      </div>
    </header>
  );
}
