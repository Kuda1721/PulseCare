import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Clock, UserCheck, Eye } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';

type FilterType = 'all' | 'critical' | 'high' | 'medium' | 'resolved';

export function Alerts() {
  const { alerts, patients, acknowledgeAlert, resolveAlert } = usePatientStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = alerts.filter(a => {
    if (filter === 'resolved') return a.resolved;
    if (filter === 'all') return !a.resolved;
    return a.type === filter && !a.resolved;
  });

  const counts = {
    all: alerts.filter(a => !a.resolved).length,
    critical: alerts.filter(a => a.type === 'critical' && !a.resolved).length,
    high: alerts.filter(a => a.type === 'high' && !a.resolved).length,
    medium: alerts.filter(a => a.type === 'medium' && !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length,
  };

  const typeConfig = {
    critical: { label: 'CRITICAL', Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
    high:     { label: 'HIGH',     Icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
    medium:   { label: 'MEDIUM',   Icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', dot: 'bg-cyan-400' },
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Critical" value={counts.critical} color="text-red-400" bg="bg-red-500/10 border-red-500/20" />
        <SummaryCard label="High" value={counts.high} color="text-amber-400" bg="bg-amber-500/10 border-amber-500/20" />
        <SummaryCard label="Resolved Today" value={counts.resolved} color="text-green-400" bg="bg-green-500/10 border-green-500/20" />
        <SummaryCard label="Avg Response" value="2m 14s" color="text-cyan-400" bg="bg-cyan-500/10 border-cyan-500/20" isText />
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 bg-[#0B1728] border border-white/[0.06] rounded-xl p-1.5 w-fit overflow-x-auto">
        {(['all','critical','high','medium','resolved'] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all
              ${filter === f ? 'bg-white/10 text-white' : 'text-[#718198] hover:text-white'}`}>
            {f === 'all' ? `All Active (${counts.all})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl py-16 text-center">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">All clear</p>
            <p className="text-[#718198] text-sm">No active alerts right now</p>
          </div>
        ) : (
          filtered.map(alert => {
            const patient = patients.find(p => p.id === alert.patientId);
            const cfg = typeConfig[alert.type as keyof typeof typeConfig];
            if (!cfg) return null;
            return (
              <div key={alert.id} className={`bg-[#0B1728] border rounded-2xl p-5 ${alert.type === 'critical' && !alert.resolved ? 'border-red-500/30' : 'border-white/[0.06]'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Severity */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
                      {alert.type === 'critical' && (
                        <span className="relative flex w-1.5 h-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-red-400" />
                        </span>
                      )}
                      {cfg.label}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{alert.message}</p>
                      <p className="text-[#718198] text-xs mt-0.5">{alert.detail}</p>
                      <div className="flex items-center gap-3 mt-2 text-[#718198] text-[10px]">
                        <span className="flex items-center gap-1"><Clock size={10} /> {alert.time}</span>
                        {alert.acknowledged && <span className="flex items-center gap-1 text-cyan-400"><UserCheck size={10} /> Acknowledged</span>}
                        {alert.assignedTo && <span className="flex items-center gap-1"><UserCheck size={10} /> {alert.assignedTo}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => navigate(`/patients/${alert.patientId}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/10 rounded-xl text-cyan-400 hover:bg-cyan-500/10 transition-all">
                      <Eye size={11} /> Review
                    </button>
                    {!alert.acknowledged && (
                      <button onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1.5 text-xs border border-white/10 rounded-xl text-[#A7B5C7] hover:bg-white/5 transition-all">
                        Acknowledge
                      </button>
                    )}
                    {!alert.resolved && (
                      <button onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1.5 text-xs bg-white/10 rounded-xl text-white hover:bg-white/15 transition-all">
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, bg, isText }: { label: string; value: number | string; color: string; bg: string; isText?: boolean }) {
  return (
    <div className={`bg-[#0B1728] border rounded-2xl p-4 ${bg}`}>
      <div className="text-[#718198] text-xs mb-2">{label}</div>
      <div className={`font-bold ${isText ? 'text-xl' : 'text-3xl'} vital-num ${color}`}>{value}</div>
    </div>
  );
}
