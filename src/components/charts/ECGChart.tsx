import { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, Play, Maximize2 } from 'lucide-react';

const ECG_TEMPLATE = [
  0, 0, 0, 0, 1, 0.5, 0, -1.5, 14, -5, 2, 0.5, 0, 0, 0, 1, 0.5, 0, 0, 0,
  0, 0, 0, 2.5, 3.5, 2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

interface Props {
  bpm?: number;
  showControls?: boolean;
  height?: number;
}

export function ECGChart({ bpm = 72, showControls = false, height = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [timeWindow, setTimeWindow] = useState<'30s' | '1m' | '5m'>('30s');

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(v => !v);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = canvas.parentElement?.clientWidth || 600;
      const h = height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // Speed proportional to BPM
    const speed = Math.max(0.8, bpm / 36);

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      // Subtle grid
      ctx!.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx!.lineWidth = 0.5;
      for (let x = 0; x < w; x += 32) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, h); ctx!.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke();
      }

      // Waveform
      const mid = h / 2;
      const scale = h / 46;
      const segLen = ECG_TEMPLATE.length;

      // Draw trailing fade effect
      const gradient = ctx!.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(40,215,232,0)');
      gradient.addColorStop(0.15, 'rgba(40,215,232,0.6)');
      gradient.addColorStop(0.7, 'rgba(40,215,232,1)');
      gradient.addColorStop(1, 'rgba(40,215,232,0.1)');

      ctx!.beginPath();
      ctx!.strokeStyle = gradient;
      ctx!.lineWidth = 1.5;
      ctx!.shadowColor = '#28D7E8';
      ctx!.shadowBlur = 6;
      ctx!.lineJoin = 'round';
      ctx!.lineCap = 'round';

      for (let x = 0; x <= w; x += 1.5) {
        const idx = ((offsetRef.current + x / 2.8) % (segLen * 20)) / 20;
        const i = Math.floor(idx) % segLen;
        const frac = idx - Math.floor(idx);
        const next = (i + 1) % segLen;
        const v = ECG_TEMPLATE[i] * (1 - frac) + ECG_TEMPLATE[next] * frac;
        const y = mid - v * scale;
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      // Scanning dot at front
      const frontX = w * 0.95;
      const frontIdx = ((offsetRef.current + frontX / 2.8) % (segLen * 20)) / 20;
      const fi = Math.floor(frontIdx) % segLen;
      const ff = frontIdx - Math.floor(frontIdx);
      const fv = ECG_TEMPLATE[fi] * (1 - ff) + ECG_TEMPLATE[(fi + 1) % segLen] * ff;
      const frontY = mid - fv * scale;

      ctx!.beginPath();
      ctx!.arc(frontX, frontY, 3, 0, Math.PI * 2);
      ctx!.fillStyle = '#28D7E8';
      ctx!.shadowColor = '#28D7E8';
      ctx!.shadowBlur = 12;
      ctx!.fill();
      ctx!.shadowBlur = 0;

      if (!pausedRef.current) offsetRef.current += speed;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [bpm, height]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="w-full block" style={{ height }} />
      {showControls && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <button onClick={togglePause}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-white/10 rounded-lg text-[#A7B5C7] hover:bg-white/5 hover:text-white transition-all">
              {paused ? <><Play size={10} /> Resume</> : <><Pause size={10} /> Pause</>}
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-white/10 rounded-lg text-[#A7B5C7] hover:bg-white/5 hover:text-white transition-all">
              <Maximize2 size={10} /> Fullscreen
            </button>
          </div>
          <div className="flex gap-1">
            {(['30s', '1m', '5m'] as const).map(t => (
              <button key={t} onClick={() => setTimeWindow(t)}
                className={`px-2 py-1 text-[10px] rounded-lg font-medium transition-all
                  ${timeWindow === t ? 'bg-white/10 text-white' : 'text-[#718198] hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
