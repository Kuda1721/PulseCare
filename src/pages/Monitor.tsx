import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePatientStore } from '../store/patientStore';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, LiveDot } from '../components/ui/StatusBadge';
import { ECGChart } from '../components/charts/ECGChart';
import { MiniSparkline } from '../components/charts/VitalChart';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { ChevronRight } from 'lucide-react';

export function Monitor() {
  const { patients } = usePatientStore();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(patients[0]?.id);

  const sorted = [...patients].sort((a, b) => {
    const o = { critical: 0, attention: 1, stable: 2, offline: 3 };
    return o[a.status] - o[b.status];
  });

  const featured = patients.find(p => p.id === selectedId) || sorted[0];

  const vitals = featured ? [
    { label: 'Heart Rate',     value: featured.heartRate,    unit: 'BPM',  color: '#FF5C67', key: 'heartRate' as const,    alert: featured.heartRate > 100 || featured.heartRate < 60 },
    { label: 'SpO₂',           value: featured.spo2,         unit: '%',    color: '#28D7E8', key: 'spo2' as const,         alert: featured.spo2 < 95 },
    { label: 'Blood Pressure', value: `${featured.systolicBP}/${featured.diastolicBP}`, unit: 'mmHg', color: '#A78BFA', key: 'systolicBP' as const, alert: featured.systolicBP > 140, isStr: true },
    { label: 'Temperature',    value: featured.temperature,  unit: '°C',   color: '#FBBF24', key: 'temperature' as const,  alert: featured.temperature > 37.5, decimals: 1 },
  ] : [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Live Patient Monitor</h2>
          <p className="text-[#718198] text-xs mt-0.5">Select a patient to view their live data</p>
        </div>
        <LiveDot />
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Patient list */}
        <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-white text-xs font-semibold">{sorted.length} Patients</span>
            <span className="text-[#718198] text-[10px]">Sort: Priority</span>
          </div>
          <div className="divide-y divide-white/[0.04] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            {sorted.map(p => {
              const isSelected = p.id === selectedId;
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left relative
                    ${isSelected ? 'bg-cyan-500/5' : 'hover:bg-white/[0.02]'}`}>
                  {isSelected && (
                    <motion.div layoutId="patient-indicator"
                      className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 40 }} />
                  )}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold">
                      {p.avatar}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0B1728]
                      ${p.status === 'stable' ? 'bg-green-400' : p.status === 'critical' ? 'bg-red-400' : p.status === 'attention' ? 'bg-amber-400' : 'bg-gray-400'}
                      ${p.status === 'critical' ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate transition-colors ${isSelected ? 'text-cyan-300' : 'text-white'}`}>{p.name}</div>
                    <div className="text-[#718198] text-[10px]">Room {p.room}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={p.status} size="sm" showIcon={false} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live view */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {featured && (
              <motion.div key={featured.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4">

                {/* Patient header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-white/10 flex items-center justify-center text-white text-xs font-bold">
                      {featured.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{featured.name}</h3>
                        <StatusBadge status={featured.status} />
                      </div>
                      <p className="text-[#718198] text-xs">Room {featured.room} · {featured.id} · Age {featured.age}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/patients/${featured.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/15 transition-all font-medium">
                    Full Profile <ChevronRight size={12} />
                  </button>
                </div>

                {/* Vital cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {vitals.map(v => (
                    <div key={v.label} className={`bg-[#0B1728] border rounded-xl p-3.5 transition-all
                      ${v.alert ? 'border-amber-500/25' : 'border-white/[0.06]'}`}>
                      <div className="text-[#718198] text-[10px] mb-2">{v.label}</div>
                      <div className="flex items-end gap-1 mb-2">
                        <span className="font-bold text-xl vital-num tabular-nums" style={{ color: v.color }}>
                          {(v as any).isStr ? v.value : <AnimatedNumber value={v.value as number} decimals={(v as any).decimals || 0} />}
                        </span>
                        <span className="text-[#718198] text-[10px] mb-0.5">{v.unit}</span>
                      </div>
                      <MiniSparkline data={featured.history} dataKey={v.key} color={v.color} />
                    </div>
                  ))}
                </div>

                {/* ECG */}
                <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-cyan-500/[0.015] pointer-events-none rounded-2xl" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <h3 className="text-white text-sm font-semibold">Cardiac Activity</h3>
                      <p className="text-[#718198] text-xs">Continuous ECG · {featured.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-white font-bold text-2xl vital-num tabular-nums">
                          <AnimatedNumber value={featured.heartRate} />
                        </span>
                        <span className="text-[#718198] text-xs ml-1.5">BPM</span>
                      </div>
                      <LiveDot />
                    </div>
                  </div>
                  <div className="p-4">
                    <ECGChart bpm={featured.heartRate} showControls height={130} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
