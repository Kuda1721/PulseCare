import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Upload, ChevronRight, Wifi, WifiOff, BatteryLow } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

type Filter = 'all' | 'stable' | 'attention' | 'critical' | 'offline';

export function Patients() {
  const { patients } = usePatientStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = patients.filter(p => {
    const matchQ = !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.room.includes(query);
    const matchF = filter === 'all' || p.status === filter || (filter === 'offline' && p.deviceStatus === 'disconnected');
    return matchQ && matchF;
  });

  const counts = {
    all:       patients.length,
    stable:    patients.filter(p => p.status === 'stable').length,
    attention: patients.filter(p => p.status === 'attention').length,
    critical:  patients.filter(p => p.status === 'critical').length,
    offline:   patients.filter(p => p.deviceStatus === 'disconnected').length,
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'stable',    label: 'Stable' },
    { key: 'attention', label: 'Needs Attention' },
    { key: 'critical',  label: 'Critical' },
    { key: 'offline',   label: 'Offline' },
  ];

  const filterColors = {
    all: '',
    stable: 'data-[active]:text-green-400',
    attention: 'data-[active]:text-amber-400',
    critical: 'data-[active]:text-red-400',
    offline: 'data-[active]:text-gray-400',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">{patients.length} Patients</h2>
          <p className="text-[#718198] text-sm mt-0.5">Registered and monitored</p>
        </div>
        <div className="flex gap-2">
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-white/[0.08] rounded-xl text-[#A7B5C7] text-xs hover:bg-white/5 hover:text-white transition-all">
            <Upload size={13} /> Import
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-white text-xs font-semibold transition-all shadow-sm shadow-cyan-500/20">
            <Plus size={13} /> Add Patient
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-[#0B1728] border border-white/[0.06] rounded-xl px-3 py-2.5 flex-1 focus-within:border-cyan-500/40 focus-within:shadow-[0_0_0_3px_rgba(40,215,232,0.06)] transition-all">
          <Search size={15} className="text-[#718198] flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, ID or room…"
            className="bg-transparent text-white text-sm placeholder-[#718198] outline-none w-full" />
        </div>
        <div className="flex gap-1 bg-[#0B1728] border border-white/[0.06] rounded-xl p-1 overflow-x-auto flex-shrink-0">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              data-active={filter === f.key ? '' : undefined}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${filter === f.key ? 'bg-white/10 text-white' : 'text-[#718198] hover:text-[#A7B5C7]'}`}>
              {f.label} <span className="opacity-50">({counts[f.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-[#0B1728] border border-white/[0.06] rounded-2xl py-16 text-center">
            <Search size={28} className="text-[#718198] mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No patients match your search</p>
            <p className="text-[#718198] text-sm">Try a different name, ID or room number</p>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Desktop table */}
            <div className="hidden md:block bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {['Patient', 'Age', 'Room', 'Heart Rate', 'SpO₂', 'Status', 'Device', 'Updated'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-[#718198] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        onClick={() => navigate(`/patients/${p.id}`)}
                        className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold">
                                {p.avatar}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B1728] ${p.status === 'stable' ? 'bg-green-400' : p.status === 'critical' ? 'bg-red-400' : p.status === 'attention' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                            </div>
                            <div>
                              <div className="text-white text-xs font-medium group-hover:text-cyan-300 transition-colors">{p.name}</div>
                              <div className="text-[#718198] text-[10px] font-mono">{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#A7B5C7] text-xs">{p.age}</td>
                        <td className="px-4 py-3 text-[#A7B5C7] text-xs">{p.room}</td>
                        <td className="px-4 py-3">
                          <span className={`vital-num text-sm font-semibold tabular-nums ${p.heartRate > 100 || p.heartRate < 60 ? 'text-amber-400' : 'text-white'}`}>
                            <AnimatedNumber value={p.heartRate} />
                          </span>
                          <span className="text-[#718198] text-xs ml-1">BPM</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`vital-num text-sm font-semibold tabular-nums ${p.spo2 < 95 ? 'text-red-400' : 'text-white'}`}>
                            <AnimatedNumber value={p.spo2} />%
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} size="sm" /></td>
                        <td className="px-4 py-3">
                          <DeviceChip status={p.deviceStatus} battery={p.battery} />
                        </td>
                        <td className="px-4 py-3 text-[#718198] text-[10px]">{p.lastUpdated}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 active:bg-white/5 cursor-pointer transition-all hover:border-white/[0.10]">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border border-white/10 flex items-center justify-center text-white text-xs font-bold">
                      {p.avatar}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B1728] ${p.status === 'stable' ? 'bg-green-400' : p.status === 'critical' ? 'bg-red-400' : p.status === 'attention' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-semibold truncate">{p.name}</span>
                      <StatusBadge status={p.status} size="sm" showIcon={false} />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#718198]">Room {p.room}</span>
                      <span className="w-px h-2.5 bg-white/10" />
                      <span className={`vital-num font-semibold tabular-nums ${p.heartRate > 100 ? 'text-amber-400' : 'text-[#A7B5C7]'}`}>
                        <AnimatedNumber value={p.heartRate} /> BPM
                      </span>
                      <span className="w-px h-2.5 bg-white/10" />
                      <span className={`vital-num tabular-nums ${p.spo2 < 95 ? 'text-red-400' : 'text-[#A7B5C7]'}`}>
                        <AnimatedNumber value={p.spo2} />% SpO₂
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#718198] flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeviceChip({ status, battery }: { status: string; battery: number }) {
  if (status === 'connected') return (
    <span className="flex items-center gap-1 text-green-400 text-[10px] font-medium">
      <Wifi size={10} /> Connected
    </span>
  );
  if (status === 'low_battery') return (
    <span className="flex items-center gap-1 text-amber-400 text-[10px] font-medium">
      <BatteryLow size={10} /> {battery}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-gray-400 text-[10px] font-medium">
      <WifiOff size={10} /> Offline
    </span>
  );
}
