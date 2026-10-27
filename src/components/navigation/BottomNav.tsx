import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Bell, Settings } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';

const ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/monitor', icon: Activity, label: 'Monitor' },
  { to: '/alerts', icon: Bell, label: 'Alerts', badge: true },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const { alerts } = usePatientStore();
  const critCount = alerts.filter(a => !a.acknowledged && !a.resolved).length;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1728]/95 backdrop-blur-md border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {ITEMS.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `
            flex-1 flex flex-col items-center gap-1 py-2.5 px-1 relative transition-colors
            ${isActive ? 'text-cyan-400' : 'text-[#718198]'}
          `}>
            {({ isActive }) => (
              <>
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-cyan-500/10' : ''}`}>
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  {badge && critCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                      {critCount > 9 ? '9+' : critCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium tracking-wide">{label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
