import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Activity, AlertTriangle, HeartPulse, ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { StatusBadge, LiveDot } from '../components/ui/StatusBadge';
import { ECGChart } from '../components/charts/ECGChart';
import { MiniSparkline } from '../components/charts/VitalChart';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function Dashboard() {
  const { patients, alerts } = usePatientStore();
  const navigate = useNavigate();

  const stable    = patients.filter(p => p.status === 'stable').length;
  const attention = patients.filter(p => p.status === 'attention').length;
  const critical  = patients.filter(p => p.status === 'critical').length;
  const monitoring = patients.filter(p => p.deviceStatus === 'connected').length;
  const activeAlerts = alerts.filter(a => !a.resolved);
  const critAlerts   = activeAlerts.filter(a => a.type === 'critical');

  const sortedPatients = [...patients].sort((a, b) => {
    const order = { critical: 0, attention: 1, stable: 2, offline: 3 };
    return order[a.status] - order[b.status];
  }).slice(0, 8);

  const featured = patients.find(p => p.id === 'PC-20481') || patients[0];

  const avgHR   = Math.round(patients.reduce((s, p) => s + p.heartRate, 0) / patients.length);
  const avgSpo2 = Math.round(patients.reduce((s, p) => s + p.spo2, 0) / patients.length);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Metric cards */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard value={patients.length} title="Total Patients" sub="+6 this week" subColor="text-green-400"
          icon={Users} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" trend="up" />
        <MetricCard value={monitoring} title="Monitoring Now" sub="● Live" subColor="text-cyan-400"
          icon={Activity} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" live />
        <MetricCard value={attention} title="Needs Attention" sub={`${Math.ceil(attention / 2)} high priority`} subColor="text-amber-400"
          icon={AlertTriangle} iconColor="text-amber-400" iconBg="bg-amber-500/10" trend="down" />
        <MetricCard value={critAlerts.length} title="Critical Alerts" sub="Requires immediate action" subColor="text-red-400"
          icon={HeartPulse} iconColor="text-red-400" iconBg="bg-red-500/10" critical={critAlerts.length > 0} />
      </motion.div>

      {/* Main grid */}
      <div className="grid xl:grid-cols-3 gap-5">
        {/* Patient table — 2 cols */}
        <motion.div className="xl:col-span-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}>
          <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-white font-semibold text-sm">Live Patient Monitoring</h2>
                <p className="text-[#718198] text-xs mt-0.5">Real-time vitals from wearable sensors</p>
              </div>
              <div className="flex items-center gap-3">
                <LiveDot />
                <span className="text-[#718198] text-xs hidden sm:block">Last updated: 2 sec ago</span>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['Patient', 'Heart Rate', 'BP', 'SpO₂', 'Temp', 'Status', 'Updated'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-[#718198] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.map((p, i) => (
                    <motion.tr key={p.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/patients/${p.id}`)}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {p.avatar}
                          </div>
                          <div>
                            <div className="text-white text-xs font-medium group-hover:text-cyan-300 transition-colors">{p.name}</div>
                            <div className="text-[#718198] text-[10px]">Room {p.room}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`vital-num text-sm font-semibold tabular-nums ${p.heartRate > 100 || p.heartRate < 60 ? 'text-amber-400' : 'text-white'}`}>
                          <AnimatedNumber value={p.heartRate} />
                        </span>
                        <span className="text-[#718198] text-xs ml-1">BPM</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="vital-num text-xs text-white tabular-nums">{p.systolicBP}/{p.diastolicBP}</span>
                        <span className="text-[#718198] text-[10px] ml-1">mmHg</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`vital-num text-sm font-semibold tabular-nums ${p.spo2 < 95 ? 'text-red-400' : 'text-white'}`}>
                          <AnimatedNumber value={p.spo2} />%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="vital-num text-xs text-white tabular-nums">
                          <AnimatedNumber value={p.temperature} decimals={1} />°C
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#718198] text-[10px]">{p.lastUpdated}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile patient cards */}
            <div className="sm:hidden divide-y divide-white/[0.04]">
              {sortedPatients.map(p => (
                <div key={p.id} onClick={() => navigate(`/patients/${p.id}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer active:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-xs font-medium">{p.name}</span>
                      <StatusBadge status={p.status} size="sm" showIcon={false} />
                    </div>
                    <div className="flex items-center gap-3 text-[#718198] text-[10px]">
                      <span className={`vital-num font-semibold tabular-nums ${p.heartRate > 100 ? 'text-amber-400' : 'text-[#A7B5C7]'}`}>
                        <AnimatedNumber value={p.heartRate} /> BPM
                      </span>
                      <span className="w-px h-2.5 bg-white/10" />
                      <span className={`vital-num tabular-nums ${p.spo2 < 95 ? 'text-red-400' : 'text-[#A7B5C7]'}`}>
                        SpO₂ <AnimatedNumber value={p.spo2} />%
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-[#718198]" />
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/[0.04]">
              <button onClick={() => navigate('/patients')} className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View all {patients.length} patients <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <motion.div className="space-y-4"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
          {/* ECG panel */}
          <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden relative">
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-cyan-500/[0.02] pointer-events-none rounded-2xl" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-semibold">Cardiac Activity</h3>
                <p className="text-[#718198] text-xs">{featured.name} · Room {featured.room}</p>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-medium">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-cyan-400" />
                </span>
                Monitoring
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3 flex items-end gap-2">
                <span className="text-white font-bold text-4xl vital-num tabular-nums">
                  <AnimatedNumber value={featured.heartRate} />
                </span>
                <span className="text-[#718198] text-sm mb-1.5">BPM</span>
                <span className="ml-auto text-green-400 text-xs font-medium">Normal Sinus Rhythm</span>
              </div>
              <ECGChart bpm={featured.heartRate} showControls height={110} />
            </div>
          </div>

          {/* Alert panel */}
          <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <h3 className="text-white text-sm font-semibold">Priority Alerts</h3>
                {critAlerts.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {critAlerts.length}
                  </span>
                )}
              </div>
              <button onClick={() => navigate('/alerts')} className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
                View all
              </button>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-56 overflow-y-auto">
              {activeAlerts.slice(0, 5).length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-2xl mb-2">✓</div>
                  <p className="text-white text-xs font-medium mb-0.5">All clear</p>
                  <p className="text-[#718198] text-xs">No active alerts right now</p>
                </div>
              ) : (
                activeAlerts.slice(0, 5).map(alert => (
                  <AlertRow key={alert.id} alert={alert}
                    patient={patients.find(p => p.id === alert.patientId)}
                    onReview={() => navigate(`/patients/${alert.patientId}`)} />
                ))
              )}
            </div>
          </div>

          {/* Vitals summary strip */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStatCard label="Avg Heart Rate" value={avgHR} unit="BPM" color="#FF5C67" />
            <MiniStatCard label="Avg SpO₂" value={avgSpo2} unit="%" color="#28D7E8" />
            <MiniStatCard label="Stable" value={`${Math.round(stable / patients.length * 100)}%`} unit="" color="#34D399" isText />
            <MiniStatCard label="Critical" value={critical} unit=" patients" color="#FF5C67" critical={critical > 0} />
          </div>
        </motion.div>
      </div>

      {/* Bottom row — fleet vitals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Heart Rate', value: avgHR, unit: 'BPM', color: '#FF5C67', key: 'heartRate' as const, sub: `${patients.filter(p => p.heartRate > 100 || p.heartRate < 60).length} outside normal` },
          { label: 'Avg SpO₂', value: avgSpo2, unit: '%', color: '#28D7E8', key: 'spo2' as const, sub: `${patients.filter(p => p.spo2 < 95).length} below threshold` },
          { label: 'Avg Temperature', value: parseFloat((patients.reduce((s, p) => s + p.temperature, 0) / patients.length).toFixed(1)), unit: '°C', color: '#FBBF24', key: 'temperature' as const, decimals: 1, sub: 'Fleet average' },
          { label: 'Patient Stability', value: Math.round(stable / patients.length * 100), unit: '%', color: '#34D399', key: null as null, sub: `${stable} of ${patients.length} stable` },
        ].map(m => (
          <div key={m.label} className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-4 card-hover">
            <div className="text-[#718198] text-xs mb-2">{m.label}</div>
            <div className="flex items-end gap-1.5 mb-1">
              <span className="text-white font-bold text-2xl vital-num tabular-nums" style={{ color: m.color }}>
                {m.key ? <AnimatedNumber value={m.value as number} decimals={(m as any).decimals || 0} /> : m.value}
              </span>
              <span className="text-[#718198] text-xs mb-0.5">{m.unit}</span>
            </div>
            <div className="text-[#718198] text-[10px] mb-3">{m.sub}</div>
            {m.key && (
              <div style={{ height: 36 }}>
                <MiniSparkline data={featured.history} dataKey={m.key} color={m.color} />
              </div>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function MetricCard({ value, title, sub, subColor, icon: Icon, iconColor, iconBg, live, critical, trend }: any) {
  return (
    <motion.div variants={item}
      className={`bg-[#0B1728] border rounded-2xl p-4 card-hover cursor-default relative overflow-hidden
        ${critical ? 'border-red-500/30' : 'border-white/[0.06]'}`}>
      {/* Top accent line */}
      {critical && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />}

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon size={17} className={iconColor} strokeWidth={1.8} />
        </div>
        <div className="flex items-center gap-1.5">
          {trend === 'up' && <TrendingUp size={12} className="text-green-400" />}
          {trend === 'down' && <TrendingDown size={12} className="text-red-400" />}
          {critical && (
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-red-400" />
            </span>
          )}
          {live && (
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-cyan-400" />
            </span>
          )}
        </div>
      </div>
      <div className="text-[#718198] text-xs mb-1">{title}</div>
      <div className="text-white font-bold text-3xl vital-num tabular-nums mb-1">
        <AnimatedNumber value={value} />
      </div>
      <div className={`text-xs ${subColor}`}>{sub}</div>
    </motion.div>
  );
}

function MiniStatCard({ label, value, unit, color, isText, critical }: any) {
  return (
    <div className={`bg-[#0B1728] border rounded-xl p-3 ${critical ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
      <div className="text-[#718198] text-[10px] mb-1">{label}</div>
      <div className="flex items-end gap-1">
        <span className="font-bold text-base vital-num tabular-nums" style={{ color }}>
          {isText ? value : <AnimatedNumber value={value} />}
        </span>
        <span className="text-[#718198] text-[10px] mb-0.5">{unit}</span>
      </div>
    </div>
  );
}

function AlertRow({ alert, patient, onReview }: { alert: any; patient: any; onReview: () => void }) {
  const typeColors: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    high: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    medium: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex-shrink-0 mt-0.5 ${typeColors[alert.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
        {alert.type === 'critical' && <span className="inline-block w-1 h-1 bg-red-400 rounded-full animate-ping mr-1" />}
        {alert.type}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium leading-tight">{alert.message}</div>
        <div className="text-[#718198] text-[10px] mt-0.5">{patient?.name} · {alert.time}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onReview(); }}
        className="text-cyan-400 text-[10px] hover:text-cyan-300 whitespace-nowrap transition-colors flex-shrink-0 mt-0.5">
        Review →
      </button>
    </div>
  );
}
