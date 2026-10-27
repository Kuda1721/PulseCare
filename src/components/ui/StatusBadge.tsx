import { AlertTriangle, CheckCircle, AlertCircle, WifiOff } from 'lucide-react';

type Status = 'stable' | 'attention' | 'critical' | 'offline';

interface Props { status: Status; size?: 'sm' | 'md'; showIcon?: boolean; }

const config = {
  stable:    { label: 'Stable',          color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20', Icon: CheckCircle },
  attention: { label: 'Needs Attention', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20', Icon: AlertTriangle },
  critical:  { label: 'Critical',        color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',   Icon: AlertCircle },
  offline:   { label: 'Offline',         color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',  Icon: WifiOff },
};

export function StatusBadge({ status, size = 'md', showIcon = true }: Props) {
  const { label, color, bg, border, Icon } = config[status];
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const iSz = size === 'sm' ? 10 : 11;

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sz} ${color} ${bg} ${border}`}>
      {showIcon && <Icon size={iSz} />}
      {status === 'critical' && (
        <span className={`relative flex w-1.5 h-1.5 ${size === 'sm' ? '' : ''}`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-red-400" />
        </span>
      )}
      {label}
    </span>
  );
}

export function LiveDot({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-cyan-400 text-xs font-medium ${className}`}>
      <span className="relative flex w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-cyan-400" />
      </span>
      LIVE
    </span>
  );
}
