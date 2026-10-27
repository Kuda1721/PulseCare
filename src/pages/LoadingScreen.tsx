import { useEffect, useState } from 'react';

const STEPS = [
  { msg: 'Connecting to patient monitoring network…', dur: 1200 },
  { msg: 'Authenticating clinical credentials…', dur: 900 },
  { msg: 'Fetching real-time patient data…', dur: 1000 },
  { msg: '42 patients currently monitored', dur: 800 },
];

interface Props { onComplete: () => void; }

export function LoadingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let total = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((s, i) => {
      timers.push(setTimeout(() => {
        setStep(i);
        setProgress((i + 1) / STEPS.length * 100);
      }, total));
      total += s.dur;
    });

    timers.push(setTimeout(() => {
      setDone(true);
      setTimeout(onComplete, 600);
    }, total));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`fixed inset-0 bg-[#07111F] flex flex-col items-center justify-center z-50 transition-opacity duration-600 ${done ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <svg width="56" height="56" viewBox="0 0 32 32" fill="none" className="mb-4">
          <circle cx="16" cy="16" r="15" stroke="#28D7E8" strokeWidth="1" opacity="0.3" />
          <circle cx="16" cy="16" r="15" stroke="#28D7E8" strokeWidth="1" strokeDasharray="3 4" opacity="0.2">
            <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="8s" repeatCount="indefinite" />
          </circle>
          <path d="M4 16 L9 16 L11 10 L14 22 L17 13 L19 18 L21 16 L28 16"
            stroke="#28D7E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div className="text-white font-bold text-2xl tracking-widest">PULSECARE</div>
        <div className="text-[#718198] text-xs tracking-[0.2em] uppercase mt-1">Remote Patient Monitoring</div>
      </div>

      {/* Message */}
      <div className="text-center mb-6 h-5">
        <p className="text-[#A7B5C7] text-sm"
          style={{ animation: 'fade-in 0.4s ease-out both' }}>
          {STEPS[step]?.msg}
        </p>
      </div>

      {/* Progress */}
      <div className="w-64 h-px bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }} />
      </div>

      {/* Pulse dot */}
      <div className="mt-8 relative">
        <span className="relative flex w-2.5 h-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
          <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-cyan-400" />
        </span>
      </div>
    </div>
  );
}
