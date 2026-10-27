import { useEffect, useState } from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

interface Props { message: string; type: 'critical' | 'success' | 'info'; onDismiss: () => void; }

export function Toast({ message, type, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 8000);
    return () => clearTimeout(t);
  }, []);

  const configs = {
    critical: { Icon: AlertTriangle, bg: 'bg-[#0B1728] border-red-500/40', icon: 'text-red-400', bar: 'bg-red-500' },
    success:  { Icon: CheckCircle,  bg: 'bg-[#0B1728] border-green-500/30', icon: 'text-green-400', bar: 'bg-green-500' },
    info:     { Icon: Info,         bg: 'bg-[#0B1728] border-cyan-500/30',  icon: 'text-cyan-400',  bar: 'bg-cyan-500' },
  };
  const { Icon, bg, icon, bar } = configs[type];

  return (
    <div className={`fixed top-4 right-4 z-[100] max-w-sm transition-all duration-300 ease-out
      ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
      <div className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl overflow-hidden ${bg}`}>
        <div className={`absolute top-0 left-0 h-0.5 w-full ${bar} opacity-80`} />
        <Icon size={16} className={`${icon} mt-0.5 flex-shrink-0`} />
        <span className="text-white text-sm leading-snug">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="text-[#718198] hover:text-white ml-auto flex-shrink-0 p-0.5">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
