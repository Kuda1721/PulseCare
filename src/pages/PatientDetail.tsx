import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, Phone, Video, MoreHorizontal,
  Heart, Droplets, Gauge, Thermometer, Watch, Wifi, Battery,
  Clock, AlertCircle, Pill, Activity, TrendingUp, TrendingDown,
  ShieldCheck, ChevronRight, Zap, Brain
} from 'lucide-react';
import { useState } from 'react';
import { usePatientStore } from '../store/patientStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ECGChart } from '../components/charts/ECGChart';
import { VitalChart } from '../components/charts/VitalChart';
import { MiniSparkline } from '../components/charts/VitalChart';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

type Range = '1H' | '6H' | '12H' | '24H' | '7D' | '30D';
type Tab = 'vitals' | 'timeline' | 'device';
const RANGE_POINTS: Record<Range, number> = { '1H': 2, '6H': 12, '12H': 24, '24H': 48, '7D': 48, '30D': 48 };

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, alerts, acknowledgeAlert, resolveAlert } = usePatientStore();
  const [range, setRange] = useState<Range>('24H');
  const [tab, setTab] = useState<Tab>('vitals');

  const patient = patients.find(p => p.id === id);
  if (!patient) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Zap size={28} className="text-[#718198]" />
      <p className="text-white font-medium">Patient not found</p>
      <button onClick={() => navigate('/patients')} className="text-cyan-400 text-sm hover:underline">Go back to Patients</button>
    </div>
  );

  const patientAlerts = alerts.filter(a => a.patientId === patient.id && !a.resolved);
  const points = RANGE_POINTS[range];

  const vitalCards = [
    { icon: Heart,       color: '#FF5C67', bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'Heart Rate',     value: patient.heartRate,    unit: 'BPM',  decimals: 0, dataKey: 'heartRate' as const,    sub: patient.heartRate > 100 || patient.heartRate < 60 ? 'Abnormal' : 'Normal', good: !(patient.heartRate > 100 || patient.heartRate < 60) },
    { icon: Gauge,       color: '#A78BFA', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Blood Pressure', value: null,                  unit: 'mmHg', decimals: 0, dataKey: 'systolicBP' as const,  sub: patient.systolicBP > 140 ? 'Elevated' : 'Normal',  good: patient.systolicBP <= 140 },
    { icon: Droplets,    color: '#28D7E8', bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   label: 'SpO₂',           value: patient.spo2,         unit: '%',    decimals: 0, dataKey: 'spo2' as const,        sub: patient.spo2 >= 97 ? 'Excellent' : patient.spo2 >= 95 ? 'Normal' : 'Low', good: patient.spo2 >= 95 },
    { icon: Thermometer, color: '#FBBF24', bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  label: 'Temperature',    value: patient.temperature,  unit: '°C',   decimals: 1, dataKey: 'temperature' as const, sub: patient.temperature > 37.5 ? 'Elevated' : 'Normal', good: patient.temperature <= 37.5 },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-white/5 text-[#718198] hover:text-white transition-all flex-shrink-0">
              <ArrowLeft size={18} />
            </button>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                {patient.avatar}
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#07111F] ${patient.status === 'stable' ? 'bg-green-400' : patient.status === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-white font-bold text-lg">{patient.name}</h1>
                <StatusBadge status={patient.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[#718198] text-xs">
                <span>{patient.gender === 'F' ? '♀' : '♂'} Age {patient.age}</span>
                <span className="w-px h-2.5 bg-white/10" />
                <span className="font-mono">{patient.id}</span>
                <span className="w-px h-2.5 bg-white/10" />
                <span>Room {patient.room}</span>
                <span className="w-px h-2.5 bg-white/10 hidden sm:block" />
                <span className="hidden sm:block truncate max-w-xs">{patient.diagnosis}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
            {[{ Icon: MessageCircle, label: 'Message' }, { Icon: Phone, label: 'Call' }, { Icon: Video, label: 'Video' }].map(({ Icon, label }) => (
              <button key={label}
                className="flex items-center gap-1.5 px-3 py-2 border border-white/[0.08] rounded-xl text-[#A7B5C7] text-xs hover:bg-white/5 hover:text-white hover:border-white/15 transition-all">
                <Icon size={12} /> {label}
              </button>
            ))}
            <button className="p-2 border border-white/[0.08] rounded-xl text-[#A7B5C7] hover:bg-white/5 transition-all">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Active alerts */}
      <AnimatePresence>
        {patientAlerts.map(a => (
          <motion.div key={a.id}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}>
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border
              ${a.type === 'critical' ? 'bg-red-500/8 border-red-500/30' : 'bg-amber-500/8 border-amber-500/25'}`}>
              <div className="flex items-center gap-3">
                {a.type === 'critical' && (
                  <span className="relative flex w-2 h-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex rounded-full w-2 h-2 bg-red-400" />
                  </span>
                )}
                <div>
                  <p className={`text-sm font-semibold ${a.type === 'critical' ? 'text-red-300' : 'text-amber-300'}`}>{a.message}</p>
                  <p className="text-[#718198] text-xs mt-0.5">{a.detail} · {a.time}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!a.acknowledged && (
                  <button onClick={() => acknowledgeAlert(a.id)}
                    className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-[#A7B5C7] hover:bg-white/5 transition-all">
                    Acknowledge
                  </button>
                )}
                <button onClick={() => resolveAlert(a.id)}
                  className="px-3 py-1.5 text-xs bg-white/8 rounded-lg text-white hover:bg-white/12 transition-all border border-white/[0.08]">
                  Resolve
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <section className="bg-[#0B1728] border border-amber-500/20 rounded-2xl p-4 sm:p-5 opacity-90" aria-label="AI Decision Support">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300 h-fit"><Brain size={18} /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white text-sm font-semibold">AI Decision Support</h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-amber-300 border border-amber-500/25 rounded-full px-2 py-0.5">Research / unavailable until validated</span>
              </div>
              <p className="text-[#718198] text-xs mt-1">No prediction is displayed until the clinical protocol, data governance, and validation gates are complete.</p>
            </div>
          </div>
          <span className="text-[10px] text-[#718198] border border-white/10 rounded-lg px-2 py-1 w-fit">Clinician review only</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          {[
            ['Risk level', 'Unavailable'],
            ['Prediction horizon', '30 minutes'],
            ['Data quality', 'Not evaluated'],
            ['Model version', 'None'],
            ['Clinician feedback', 'Unavailable'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[#718198] text-[10px]">{label}</div>
              <div className="text-white/50 text-xs mt-1">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Vital cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {vitalCards.map(({ icon: Icon, color, bg, border, label, value, unit, decimals, dataKey, sub, good }) => (
          <motion.div key={label}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
            className={`bg-[#0B1728] border rounded-2xl p-4 card-hover ${!good ? border : 'border-white/[0.06]'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${bg}`}><Icon size={13} style={{ color }} /></div>
              <span className={`text-[10px] font-medium flex items-center gap-1 ${good ? 'text-green-400' : 'text-amber-400'}`}>
                {good ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{sub}
              </span>
            </div>
            <div className="text-[#718198] text-[10px] mb-1">{label}</div>
            <div className="flex items-end gap-1 mb-2">
              {value !== null ? (
                <>
                  <span className="text-white font-bold text-2xl vital-num tabular-nums" style={{ color }}>
                    <AnimatedNumber value={value as number} decimals={decimals} />
                  </span>
                  <span className="text-[#718198] text-xs mb-0.5">{unit}</span>
                </>
              ) : (
                <>
                  <span className="text-white font-bold text-xl vital-num tabular-nums" style={{ color }}>
                    <AnimatedNumber value={patient.systolicBP} />/<AnimatedNumber value={patient.diastolicBP} />
                  </span>
                  <span className="text-[#718198] text-xs mb-0.5">{unit}</span>
                </>
              )}
            </div>
            <div style={{ height: 36 }}>
              <MiniSparkline data={patient.history} dataKey={dataKey} color={color} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs + content */}
      <div className="flex gap-1 bg-[#0B1728] border border-white/[0.06] rounded-xl p-1 w-fit">
        {([['vitals', 'Charts & ECG'], ['timeline', 'Timeline'], ['device', 'Device']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-white/10 text-white' : 'text-[#718198] hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {tab === 'vitals' && <VitalsTab patient={patient} range={range} setRange={setRange} points={points} />}
          {tab === 'timeline' && <TimelineTab patient={patient} />}
          {tab === 'device' && <DeviceTab patient={patient} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function VitalsTab({ patient, range, setRange, points }: any) {
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        {/* Range selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Vital Trends</h2>
          <div className="flex gap-1 bg-[#0B1728] border border-white/[0.06] rounded-xl p-1">
            {(['1H', '6H', '12H', '24H', '7D', '30D'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${range === r ? 'bg-white/10 text-white' : 'text-[#718198] hover:text-white'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ECG */}
        <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm font-semibold">Cardiac Activity</h3>
              <p className="text-[#718198] text-xs">Continuous ECG monitoring · {patient.room}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-xl vital-num tabular-nums">
                <AnimatedNumber value={patient.heartRate} />
              </span>
              <span className="text-[#718198] text-xs">BPM</span>
              <span className="text-green-400 text-xs font-medium hidden sm:block">Normal Sinus Rhythm</span>
            </div>
          </div>
          <div className="p-4">
            <ECGChart bpm={patient.heartRate} showControls height={120} />
          </div>
        </div>

        {/* Vital charts 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Heart Rate', dataKey: 'heartRate' as const, color: '#FF5C67', unit: 'BPM', domain: [40, 180] as [number, number] },
            { label: 'SpO₂', dataKey: 'spo2' as const, color: '#28D7E8', unit: '%', domain: [80, 100] as [number, number] },
            { label: 'Blood Pressure (Systolic)', dataKey: 'systolicBP' as const, color: '#A78BFA', unit: 'mmHg', domain: [80, 200] as [number, number] },
            { label: 'Temperature', dataKey: 'temperature' as const, color: '#FBBF24', unit: '°C', domain: [35, 40] as [number, number] },
          ].map(c => (
            <div key={c.label} className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
                <span className="text-white text-xs font-medium">{c.label}</span>
                <span className="text-[#718198] text-[10px]">{c.unit}</span>
              </div>
              <div className="p-2" style={{ height: 130 }}>
                <VitalChart data={patient.history} dataKey={c.dataKey} color={c.color} unit={c.unit} label={c.label} domain={c.domain} timeRange={points} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: quick stats */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-sm">Health Summary</h3>
        <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          {[
            { label: 'Heart Rate', value: patient.heartRate, unit: 'BPM', color: '#FF5C67', normal: '60–100 BPM', ok: patient.heartRate >= 60 && patient.heartRate <= 100 },
            { label: 'SpO₂', value: `${patient.spo2}%`, unit: '', color: '#28D7E8', normal: '≥95%', ok: patient.spo2 >= 95 },
            { label: 'Systolic BP', value: `${patient.systolicBP}`, unit: 'mmHg', color: '#A78BFA', normal: '<140 mmHg', ok: patient.systolicBP < 140 },
            { label: 'Temperature', value: patient.temperature, unit: '°C', color: '#FBBF24', normal: '36.1–37.5°C', ok: patient.temperature >= 36.1 && patient.temperature <= 37.5, decimals: 1 },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div>
                <div className="text-[#718198] text-xs mb-0.5">{s.label}</div>
                <div className="text-[10px] text-[#718198]/60">Normal: {s.normal}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm vital-num tabular-nums" style={{ color: s.color }}>
                  {typeof s.value === 'number' ? (
                    <AnimatedNumber value={s.value} decimals={(s as any).decimals || 0} />
                  ) : s.value} {s.unit}
                </div>
                <div className={`text-[10px] flex items-center gap-1 justify-end mt-0.5 ${s.ok ? 'text-green-400' : 'text-amber-400'}`}>
                  {s.ok ? '✓ Normal' : '⚠ Elevated'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-4">
          <h4 className="text-white text-xs font-semibold mb-3">Patient Information</h4>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Attending', value: patient.doctor },
              { label: 'Admitted', value: patient.admittedDate },
              { label: 'Diagnosis', value: patient.diagnosis },
              { label: 'Ward', value: `Room ${patient.room}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-[#718198]">{label}</span>
                <span className="text-[#A7B5C7] text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ patient }: any) {
  const icons = { alert: AlertCircle, medication: Pill, device: Watch, vitals: Activity, note: MessageCircle };
  const colors = {
    alert:      'text-red-400 bg-red-500/10 border-red-500/20',
    medication: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    device:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
    vitals:     'text-green-400 bg-green-500/10 border-green-500/20',
    note:       'text-[#718198] bg-white/5 border-white/10',
  };

  return (
    <div className="max-w-2xl">
      {patient.timeline.length === 0 ? (
        <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl py-12 text-center">
          <Clock size={28} className="text-[#718198] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No events recorded</p>
          <p className="text-[#718198] text-sm">Timeline events will appear here</p>
        </div>
      ) : (
        <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-5">
          <div className="space-y-0">
            {patient.timeline.map((event: any, i: number) => {
              const Icon = icons[event.type as keyof typeof icons] || Activity;
              const colorClass = colors[event.type as keyof typeof colors] || colors.note;
              return (
                <motion.div key={event.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex gap-4 relative">
                  {i < patient.timeline.length - 1 && (
                    <div className="absolute left-4 top-9 bottom-0 w-px bg-white/[0.06]" />
                  )}
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                    <Icon size={12} />
                  </div>
                  <div className="pb-5">
                    <div className="text-[#718198] text-[10px] font-medium uppercase tracking-wide">{event.time}</div>
                    <div className="text-[#A7B5C7] text-sm mt-1 leading-relaxed">{event.message}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceTab({ patient }: any) {
  return (
    <div className="max-w-md space-y-4">
      <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/[0.06]">
          <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
            <Watch size={22} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-white font-semibold">PulseCare Band</div>
            <div className={`text-xs flex items-center gap-1.5 mt-1 font-medium ${patient.deviceStatus === 'connected' ? 'text-green-400' : patient.deviceStatus === 'low_battery' ? 'text-amber-400' : 'text-gray-400'}`}>
              {patient.deviceStatus === 'connected' ? (
                <><span className="relative flex w-1.5 h-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" /><span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-green-400" /></span>Connected</>
              ) : patient.deviceStatus === 'low_battery' ? '⚡ Low Battery' : '○ Disconnected'}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-white text-xs font-mono">{patient.deviceId}</div>
            <div className="text-[#718198] text-[10px] mt-0.5">Device ID</div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Battery bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#718198]"><Battery size={12} />Battery</div>
              <span className={`font-semibold ${patient.battery < 20 ? 'text-red-400' : patient.battery < 50 ? 'text-amber-400' : 'text-green-400'}`}>{patient.battery}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${patient.battery < 20 ? 'bg-red-500' : patient.battery < 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${patient.battery}%` }} />
            </div>
          </div>

          {[
            { icon: Wifi, label: 'Signal Strength', value: patient.signal, color: patient.signal === 'Excellent' ? 'text-green-400' : 'text-amber-400' },
            { icon: Clock, label: 'Last Sync', value: patient.lastSync, color: 'text-cyan-400' },
            { icon: ShieldCheck, label: 'Encryption', value: 'AES-256', color: 'text-green-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-2 text-[#718198] text-xs"><Icon size={12} />{label}</div>
              <span className={`text-xs font-medium ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {patient.deviceStatus === 'disconnected' && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4 flex gap-3">
          <Wifi size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium">Device connection unavailable</p>
            <p className="text-[#718198] text-xs mt-0.5">Last known connection: {patient.lastSync}. Nurse has been notified.</p>
          </div>
        </div>
      )}
    </div>
  );
}
