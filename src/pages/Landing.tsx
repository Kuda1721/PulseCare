import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Shield, Wifi, Cloud, Bell, Activity, Heart, Droplets, Thermometer,
  ChevronRight, ArrowRight, Lock, Users, Gauge, Watch,
  AlertTriangle, ShieldCheck, CheckCircle
} from 'lucide-react';

/* ─── Animated scroll fade ─── */
function FadeIn({ children, delay = 0, x = 0 }: { children: React.ReactNode; delay?: number; x?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: x === 0 ? 24 : 0, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ─── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = () => {
      start = Math.min(target, start + Math.ceil(target / 40));
      setVal(start);
      if (start < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Minimal hero ECG ─── */
function HeroECG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const animRef = useRef<number>(0);
  const ECG = [0,0,1.5,0.8,0,-2,14,-5,2,0.5,0,0,0,1,0.5,0,0,0,0,0,0,2.5,3.5,2.5,0,0,0,0,0,0,0,0,0,0,0,0];

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = 280; canvas.height = 44;

    function draw() {
      ctx!.clearRect(0, 0, 280, 44);
      ctx!.beginPath();
      ctx!.strokeStyle = '#28D7E8'; ctx!.lineWidth = 1.5;
      ctx!.shadowColor = '#28D7E8'; ctx!.shadowBlur = 5;
      const mid = 22, scale = 2.2;
      for (let x = 0; x <= 280; x += 1.5) {
        const idx = Math.floor((offsetRef.current + x / 3) % (ECG.length * 20)) / 20;
        const i = Math.floor(idx) % ECG.length;
        const v = ECG[i] * (1 - (idx % 1)) + ECG[(i+1)%ECG.length] * (idx % 1);
        x === 0 ? ctx!.moveTo(x, mid - v * scale) : ctx!.lineTo(x, mid - v * scale);
      }
      ctx!.stroke(); ctx!.shadowBlur = 0;
      offsetRef.current += 1.5;
      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ width: 280, height: 44 }} />;
}

/* ─── Remote care network SVG animation ─── */
function NetworkViz() {
  const patients = [
    { cx: 120, cy: 80, label: 'Room 204' },
    { cx: 280, cy: 50, label: 'Room 211' },
    { cx: 60, cy: 200, label: 'Room 319' },
    { cx: 240, cy: 200, label: 'Room 108' },
    { cx: 170, cy: 300, label: 'Room 215' },
  ];
  const hub = { cx: 170, cy: 175 };
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % patients.length), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative select-none">
      <svg viewBox="0 0 340 360" className="w-full max-w-xs mx-auto" style={{ filter: 'drop-shadow(0 0 24px rgba(40,215,232,0.08))' }}>
        {/* Connection lines */}
        {patients.map((p, i) => (
          <g key={i}>
            <line x1={hub.cx} y1={hub.cy} x2={p.cx} y2={p.cy}
              stroke="rgba(40,215,232,0.12)" strokeWidth="1" />
            <line x1={hub.cx} y1={hub.cy} x2={p.cx} y2={p.cy}
              stroke="#28D7E8" strokeWidth="1.5" strokeDasharray="4 6" opacity={pulse === i ? 0.7 : 0.2}>
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.2s" repeatCount="indefinite" />
            </line>
          </g>
        ))}

        {/* Patient nodes */}
        {patients.map((p, i) => (
          <g key={i} transform={`translate(${p.cx},${p.cy})`}>
            <circle r="22" fill="#0B1728" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {pulse === i && (
              <circle r="22" fill="none" stroke="#28D7E8" strokeWidth="1" opacity="0.6">
                <animate attributeName="r" from="22" to="36" dur="1s" repeatCount="1" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="1" />
              </circle>
            )}
            <text textAnchor="middle" dy="4" fontSize="9" fill="#28D7E8" fontFamily="Inter,sans-serif" fontWeight="600">
              {['EW','JC','OB','MD','SM'][i]}
            </text>
          </g>
        ))}

        {/* Hub — doctor dashboard */}
        <g transform={`translate(${hub.cx},${hub.cy})`}>
          <circle r="34" fill="#0B1728" stroke="#28D7E8" strokeWidth="1.5" />
          <circle r="34" fill="none" stroke="#28D7E8" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" from="34" to="50" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text textAnchor="middle" dy="-3" fontSize="8" fill="#718198" fontFamily="Inter,sans-serif">Doctor</text>
          <text textAnchor="middle" dy="9" fontSize="8" fill="#28D7E8" fontFamily="Inter,sans-serif" fontWeight="600">Dashboard</text>
        </g>

        {/* Labels */}
        {patients.map((p, i) => (
          <text key={i} x={p.cx} y={p.cy + 36} textAnchor="middle" fontSize="8" fill="#718198" fontFamily="Inter,sans-serif">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ─── Mini dashboard preview ─── */
function DashboardPreview() {
  const [hr, setHr] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setHr(h => Math.max(65, Math.min(80, h + Math.round((Math.random() - 0.5) * 3))));
      setSpo2(s => Math.max(96, Math.min(100, s + Math.round((Math.random() - 0.5)))));
    }, 2000);
    const a = setTimeout(() => setShowAlert(true), 6000);
    return () => { clearInterval(t); clearTimeout(a); };
  }, []);

  return (
    <div className="relative">
      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-72 bg-[#0B1728]/95 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl"
        style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '0s' }}>

        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-xs font-semibold">Live Monitor</span>
          <span className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" /> LIVE
          </span>
        </div>

        {/* Patient row */}
        <div className="flex items-center gap-2.5 mb-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/40 to-blue-600/40 flex items-center justify-center text-white text-[10px] font-bold">EW</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium">Emma Wilson</div>
            <div className="flex items-center gap-1 text-green-400 text-[9px] mt-0.5">
              <span className="w-1 h-1 bg-green-400 rounded-full" /> Stable · Room 204
            </div>
          </div>
        </div>

        {/* Vital grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Heart Rate', value: `${hr}`, unit: 'BPM', color: 'text-red-400' },
            { label: 'SpO₂', value: `${spo2}`, unit: '%', color: 'text-cyan-400' },
            { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', color: 'text-purple-400' },
            { label: 'Temperature', value: '36.7', unit: '°C', color: 'text-amber-400' },
          ].map(v => (
            <div key={v.label} className="bg-white/5 rounded-xl p-2 border border-white/[0.04]">
              <div className="text-[#718198] text-[9px] mb-0.5">{v.label}</div>
              <div className="flex items-end gap-0.5">
                <span className={`vital-num text-sm font-bold ${v.color}`}>{v.value}</span>
                <span className="text-[#718198] text-[9px] mb-0.5">{v.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <HeroECG />
      </motion.div>

      {/* Floating alert badge */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            className="absolute -top-5 -right-8 bg-[#0B1728] border border-amber-500/40 rounded-xl p-2.5 shadow-xl max-w-[160px]">
            <div className="flex items-start gap-2">
              <AlertTriangle size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white text-[10px] font-semibold leading-tight">HR Elevated</div>
                <div className="text-[#718198] text-[9px] mt-0.5">James Carter · 104 BPM</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stable badge */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.4 }}
        className="absolute -bottom-4 -left-6 bg-[#0B1728] border border-green-500/30 rounded-xl px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <CheckCircle size={11} className="text-green-400" />
          <span className="text-green-400 text-[10px] font-medium">SpO₂ Excellent · 98%</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main export ─── */
export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07111F] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#07111F]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="#28D7E8" strokeWidth="1" opacity="0.4" />
              <path d="M4 16 L9 16 L11 10 L14 22 L17 13 L19 18 L21 16 L28 16"
                stroke="#28D7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="text-white font-bold text-sm tracking-wider">PULSECARE</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#A7B5C7]">
            {['Features', 'How it works', 'Security'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20">
            Launch Dashboard <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/4 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/5 rounded-full px-3 py-1.5 text-xs text-cyan-400 font-medium mb-6">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-cyan-400" />
                </span>
                REAL-TIME PATIENT MONITORING
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}
                className="text-4xl sm:text-5xl lg:text-[52px] font-bold leading-[1.1] tracking-tight mb-6">
                Know what's happening.{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Before it becomes critical.
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[#A7B5C7] text-lg leading-relaxed mb-8 max-w-lg">
                PulseCare continuously monitors patient vitals, detects dangerous changes and instantly connects doctors to the information they need to act faster.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}
                className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5">
                  Launch Dashboard <ArrowRight size={16} />
                </button>
                <a href="#how-it-works"
                  className="flex items-center gap-2 border border-white/12 hover:border-white/20 text-[#A7B5C7] hover:text-white px-6 py-3 rounded-xl transition-all hover:bg-white/5">
                  See How It Works <ChevronRight size={16} />
                </a>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center gap-8 mt-10 pt-8 border-t border-white/[0.06]">
                {[
                  { value: <Counter target={42} />, label: 'Patients Monitored' },
                  { value: '99.9%', label: 'Platform Uptime' },
                  { value: '<30s', label: 'Alert Response' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-white font-bold text-xl vital-num">{s.value}</div>
                    <div className="text-[#718198] text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <div className="flex justify-center lg:justify-end relative py-8">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust bar ─── */}
      <section className="py-10 border-y border-white/[0.06] bg-[#0B1728]/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Activity, label: '24/7 Monitoring', desc: 'Continuous vital surveillance' },
              { icon: Wifi,     label: 'Real-time Data',  desc: 'Sub-second transmission' },
              { icon: Bell,     label: 'Instant Alerts',  desc: 'Threshold-based detection' },
              { icon: Cloud,    label: 'Remote Access',   desc: 'Monitor from anywhere' },
            ].map(({ icon: Icon, label, desc }) => (
              <FadeIn key={label}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/15 rounded-xl flex-shrink-0">
                    <Icon size={15} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{label}</div>
                    <div className="text-[#718198] text-xs mt-0.5">{desc}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="text-cyan-400 text-xs font-semibold tracking-[0.15em] uppercase mb-3">HOW IT WORKS</div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">From sensor to screen in seconds</h2>
              <p className="text-[#A7B5C7] max-w-lg mx-auto leading-relaxed">A seamless pipeline from wearable data collection to clinical decision support</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '01', icon: Watch,    label: 'Wear',    desc: 'Wearable sensors continuously collect vitals every second, day and night.' },
              { num: '02', icon: Wifi,     label: 'Connect', desc: 'Data is securely encrypted and transmitted to the cloud in real time.' },
              { num: '03', icon: Activity, label: 'Monitor', desc: 'Doctors see live patient information on any device, from anywhere.' },
              { num: '04', icon: Bell,     label: 'Respond', desc: 'Critical changes trigger immediate alerts to the right clinical staff.' },
            ].map(({ num, icon: Icon, label, desc }, i) => (
              <FadeIn key={label} delay={i * 0.1}>
                <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-6 card-hover relative overflow-hidden group">
                  <div className="text-[#718198]/20 font-bold text-7xl absolute -top-2 -right-1 vital-num select-none group-hover:text-[#718198]/30 transition-colors">{num}</div>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/15 rounded-xl w-fit mb-4">
                    <Icon size={18} className="text-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">{label}</h3>
                  <p className="text-[#718198] text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Vitals ─── */}
      <section id="features" className="py-24 px-6 bg-[#0B1728]/50">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Every heartbeat. Every signal.<br />One clear picture.</h2>
              <p className="text-[#A7B5C7] max-w-lg mx-auto leading-relaxed">PulseCare tracks the vitals that matter most, and surfaces anomalies before they become emergencies.</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Heart,       color: '#FF5C67', bg: 'bg-red-500/10',    border: 'hover:border-red-500/40',    label: 'Heart Rate',     value: '72 BPM',   sub: 'Normal sinus rhythm', range: '60–100 BPM' },
              { icon: Gauge,       color: '#A78BFA', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/40', label: 'Blood Pressure', value: '118/76',    sub: 'Normal systolic/diastolic', range: '<120/80 mmHg' },
              { icon: Droplets,    color: '#28D7E8', bg: 'bg-cyan-500/10',   border: 'hover:border-cyan-500/40',   label: 'SpO₂',           value: '98%',       sub: 'Excellent oxygen saturation', range: '≥95%' },
              { icon: Thermometer, color: '#FBBF24', bg: 'bg-amber-500/10',  border: 'hover:border-amber-500/40',  label: 'Temperature',    value: '36.7°C',    sub: 'Normal body temperature', range: '36.1–37.5°C' },
            ].map(({ icon: Icon, color, bg, border, label, value, sub, range }, i) => (
              <FadeIn key={label} delay={i * 0.08}>
                <div className={`bg-[#0B1728] border border-white/[0.06] ${border} rounded-2xl p-5 card-hover transition-all`}>
                  <div className={`p-3 rounded-xl w-fit mb-4 ${bg}`}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="text-white font-semibold mb-1">{label}</h3>
                  <div className="text-2xl font-bold vital-num mb-1" style={{ color }}>{value}</div>
                  <p className="text-[#718198] text-xs mb-3 leading-snug">{sub}</p>
                  <div className="border-t border-white/[0.06] pt-3">
                    <span className="text-[#718198] text-[10px]">Normal range: {range}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Alert section ─── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <div className="text-cyan-400 text-xs font-semibold tracking-[0.15em] uppercase mb-3">INTELLIGENT ALERTING</div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-5">When something changes,<br />PulseCare speaks up.</h2>
                <p className="text-[#A7B5C7] mb-8 leading-relaxed">Configurable threshold detection automatically flags dangerous vital changes and notifies the right clinician before the situation becomes an emergency.</p>
                <div className="space-y-2">
                  {[
                    { step: 'Normal vitals detected and logged', color: 'bg-green-500', done: true },
                    { step: 'Threshold exceeded — SpO₂ 89%', color: 'bg-red-500', done: false },
                    { step: 'Alert generated and delivered', color: 'bg-amber-500', done: false },
                    { step: 'Doctor reviews patient profile', color: 'bg-cyan-500', done: false },
                    { step: 'Alert acknowledged and resolved', color: 'bg-green-500', done: false },
                  ].map(({ step, color, done }, i) => (
                    <motion.div key={step}
                      initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="flex items-center gap-3 p-3 bg-[#0B1728] border border-white/[0.06] rounded-xl hover:border-white/[0.10] transition-all">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                      <span className="text-[#A7B5C7] text-sm">{step}</span>
                      <span className="ml-auto text-[#718198] text-xs">0{i + 1}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15} x={24}>
              <div className="space-y-3">
                <div className="bg-[#0B1728] border border-red-500/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex w-2 h-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                      <span className="relative inline-flex rounded-full w-2 h-2 bg-red-400" />
                    </span>
                    <span className="text-red-400 text-xs font-bold uppercase tracking-wide">Critical Alert</span>
                  </div>
                  <p className="text-white font-semibold mb-1">SpO₂ dropped below safe threshold</p>
                  <p className="text-[#718198] text-sm mb-4">Olivia Brown · SpO₂: 89% · Room 319 · 12:42 PM</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-medium rounded-lg hover:bg-cyan-400 transition-all">Review Patient</button>
                    <button className="px-3 py-1.5 border border-white/10 text-[#A7B5C7] text-xs rounded-lg hover:bg-white/5 transition-all">Acknowledge</button>
                  </div>
                </div>
                <div className="bg-[#0B1728] border border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wide">High Priority</span>
                  </div>
                  <p className="text-white font-semibold mb-0.5">Heart rate elevated</p>
                  <p className="text-[#718198] text-sm">James Carter · Heart Rate: 104 BPM · 12:38 PM</p>
                </div>
                <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Emma Wilson — All vitals normal</p>
                    <p className="text-[#718198] text-xs">Heart rate 72 BPM · SpO₂ 98% · Temp 36.7°C</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Remote care ─── */}
      <section className="py-24 px-6 bg-[#0B1728]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn delay={0.1} x={-24}>
              <div className="py-8">
                <NetworkViz />
                <p className="text-center text-[#718198] text-xs mt-4">Live connection between doctor dashboard and patient wearables</p>
              </div>
            </FadeIn>
            <FadeIn>
              <div>
                <div className="text-cyan-400 text-xs font-semibold tracking-[0.15em] uppercase mb-3">REMOTE CARE</div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-5">One doctor.<br />Every patient. Simultaneously.</h2>
                <p className="text-[#A7B5C7] leading-relaxed mb-6">PulseCare keeps every patient connected to their clinical team — even across wards, buildings, or time zones. A single dashboard gives complete visibility into your entire patient cohort in real time.</p>
                <div className="space-y-3">
                  {[
                    'Simultaneous monitoring of multiple patients',
                    'Instant alert escalation to on-call staff',
                    'Remote telemedicine consultation integration',
                    'Historical trend analysis per patient',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-[#A7B5C7]">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0" />{f}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Security ─── */}
      <section id="security" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for sensitive health data.</h2>
              <p className="text-[#A7B5C7] max-w-lg mx-auto leading-relaxed">Security is foundational — not an afterthought. Every layer of PulseCare is designed with data protection in mind.</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Lock,       label: 'Encrypted Data',        desc: 'End-to-end encryption for all vital data in transit and at rest.' },
              { icon: Shield,     label: 'Secure Infrastructure', desc: 'Cloud infrastructure with enterprise-grade security controls.' },
              { icon: Users,      label: 'Role-Based Access',     desc: 'Fine-grained permissions ensure staff see only what they need.' },
              { icon: ShieldCheck,label: 'Audit Trails',          desc: 'Complete logs of all access events and critical actions.' },
            ].map(({ icon: Icon, label, desc }, i) => (
              <FadeIn key={label} delay={i * 0.08}>
                <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl p-5 card-hover hover:border-cyan-500/20 transition-all">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/15 rounded-xl w-fit mb-4">
                    <Icon size={18} className="text-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{label}</h3>
                  <p className="text-[#718198] text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/5 rounded-full px-3 py-1.5 text-xs text-cyan-400 mb-6">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              42 patients currently monitored
            </div>
            <h2 className="text-4xl font-bold mb-5">See PulseCare in action.</h2>
            <p className="text-[#A7B5C7] mb-8 leading-relaxed max-w-xl mx-auto">Explore the full clinical dashboard with live simulated patient data, real-time ECG monitoring, and interactive alerts.</p>
            <button onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 text-base">
              Launch Dashboard <ArrowRight size={18} />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="#28D7E8" strokeWidth="1" opacity="0.4" />
              <path d="M4 16 L9 16 L11 10 L14 22 L17 13 L19 18 L21 16 L28 16"
                stroke="#28D7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <div>
              <div className="text-white text-xs font-bold tracking-wider">PULSECARE</div>
              <div className="text-[#718198] text-[10px]">Continuous monitoring. Better decisions.</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[#718198] text-xs">
            {['Features', 'How It Works', 'Security', 'Privacy', 'Terms'].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
