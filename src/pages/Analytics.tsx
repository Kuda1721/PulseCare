import { useState } from 'react';
import { usePatientStore } from '../store/patientStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const ALERT_FREQ = [
  { day: 'Mon', critical: 2, high: 4, medium: 3 },
  { day: 'Tue', critical: 1, high: 3, medium: 5 },
  { day: 'Wed', critical: 3, high: 2, medium: 4 },
  { day: 'Thu', critical: 0, high: 5, medium: 2 },
  { day: 'Fri', critical: 2, high: 3, medium: 6 },
  { day: 'Sat', critical: 1, high: 2, medium: 3 },
  { day: 'Sun', critical: 2, high: 4, medium: 2 },
];

const PIE_DATA = [
  { name: 'Stable', value: 14, color: '#34D399' },
  { name: 'Needs Attention', value: 4, color: '#FBBF24' },
  { name: 'Critical', value: 1, color: '#FF5C67' },
  { name: 'Offline', value: 1, color: '#718198' },
];

const UPTIME_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  uptime: 95 + Math.random() * 4.5,
}));

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B1728] border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[#718198] text-[10px] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || p.stroke }} className="text-xs font-medium">
          {p.name}: {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export function Analytics() {
  const { patients, alerts } = usePatientStore();
  const [dateRange, setDateRange] = useState('7D');

  const avgHR = Math.round(patients.reduce((s, p) => s + p.heartRate, 0) / patients.length);
  const avgSpo2 = Math.round(patients.reduce((s, p) => s + p.spo2, 0) / patients.length);
  const stableRate = Math.round(patients.filter(p => p.status === 'stable').length / patients.length * 100);
  const resolved = alerts.filter(a => a.resolved).length;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Response Time', value: '2m 14s', sub: '↓ 12% vs last week', subColor: 'text-green-400' },
          { label: 'Patient Stability Rate', value: `${stableRate}%`, sub: `${patients.filter(p=>p.status==='stable').length} of ${patients.length} stable`, subColor: 'text-[#718198]' },
          { label: 'Alerts Resolved', value: resolved, sub: 'This week', subColor: 'text-[#718198]' },
          { label: 'Device Uptime', value: '98.7%', sub: '30 day average', subColor: 'text-cyan-400' },
        ].map(m => (
          <div key={m.label} className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-4">
            <div className="text-[#718198] text-xs mb-2">{m.label}</div>
            <div className="text-white font-bold text-2xl vital-num mb-1">{m.value}</div>
            <div className={`text-xs ${m.subColor}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Analytics Overview</h2>
        <div className="flex gap-1 bg-[#0B1728] border border-white/[0.06] rounded-xl p-1">
          {['24H','7D','30D','90D'].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${dateRange === r ? 'bg-white/10 text-white' : 'text-[#718198] hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Alert frequency */}
        <div className="lg:col-span-2 bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-white text-sm font-semibold">Alert Frequency</h3>
            <p className="text-[#718198] text-xs">Alerts by severity over time</p>
          </div>
          <div className="p-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ALERT_FREQ} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#718198', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#718198', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="critical" name="Critical" fill="#FF5C67" radius={[3, 3, 0, 0]} />
                <Bar dataKey="high" name="High" fill="#FBBF24" radius={[3, 3, 0, 0]} />
                <Bar dataKey="medium" name="Medium" fill="#28D7E8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient status distribution */}
        <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-white text-sm font-semibold">Patient Status</h3>
            <p className="text-[#718198] text-xs">Current distribution</p>
          </div>
          <div className="p-4 flex flex-col items-center">
            <div style={{ height: 160 }} className="w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={PIE_DATA} innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 w-full mt-2">
              {PIE_DATA.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[#A7B5C7]">{d.name}</span>
                  </div>
                  <span className="text-white font-medium vital-num">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device uptime */}
        <div className="lg:col-span-3 bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-white text-sm font-semibold">Device Uptime — 30 Days</h3>
            <p className="text-[#718198] text-xs">Average uptime across all connected wearables</p>
          </div>
          <div className="p-4" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={UPTIME_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#718198', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[90, 100]} tick={{ fill: '#718198', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="uptime" name="Uptime %" stroke="#34D399" strokeWidth={1.5} fill="url(#uptimeGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
