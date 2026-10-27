import { Bell, Shield, Sliders, User, DatabaseZap } from 'lucide-react';
import { THRESHOLDS } from '../data/thresholds';
import { getDataMode, setDataMode } from '../store/patientStore';

export function Settings() {
  const dataMode = getDataMode();

  return (
    <div className="space-y-5 max-w-3xl">
      <Section title="Data Source Mode" subtitle="Demo Dataset Replay is isolated from production API mode" icon={DatabaseZap}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium text-white">Demo Dataset Replay</p>
              <p className="text-xs text-[#718198]">Approved presentation mode using deterministic replay, not random jitter</p>
            </div>
            <button
              onClick={() => setDataMode('demo')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dataMode === 'demo' ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${dataMode === 'demo' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium text-white">Production API</p>
              <p className="text-xs text-[#718198]">Clinical backend stream with validation and deterministic safety rules</p>
            </div>
            <button
              onClick={() => setDataMode('api')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dataMode === 'api' ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${dataMode === 'api' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-[11px] text-amber-300">Clinical decision support is not autonomous diagnosis. Rule-based hard alerts remain active regardless of model status.</p>
        </div>
      </Section>

      <Section title="Monitoring Thresholds" subtitle="Clinician-approved rule baseline — not medical guidelines" icon={Sliders}>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Heart Rate Low', value: THRESHOLDS.heartRate.low, unit: 'BPM' },
            { label: 'Heart Rate High', value: THRESHOLDS.heartRate.high, unit: 'BPM' },
            { label: 'SpO₂ Low', value: THRESHOLDS.spo2.low, unit: '%' },
            { label: 'SpO₂ Critical', value: THRESHOLDS.spo2.critical_low, unit: '%' },
            { label: 'Systolic BP High', value: THRESHOLDS.systolicBP.high, unit: 'mmHg' },
            { label: 'Temperature High', value: THRESHOLDS.temperature.high, unit: '°C' },
          ].map(t => (
            <div key={t.label}>
              <label className="text-[#718198] text-xs block mb-1.5">{t.label}</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-cyan-500/40 transition-all">
                <input defaultValue={t.value} type="number"
                  className="bg-transparent text-white text-sm outline-none flex-1 vital-num" />
                <span className="text-[#718198] text-xs">{t.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Notifications" subtitle="Alert delivery preferences" icon={Bell}>
        <div className="space-y-3">
          {['Critical alerts', 'High priority alerts', 'Device disconnections', 'Low battery warnings'].map(item => (
            <div key={item} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[#A7B5C7] text-sm">{item}</span>
              <button className="w-10 h-5 bg-cyan-500 rounded-full relative transition-all">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Security" subtitle="Access control and audit settings" icon={Shield}>
        <div className="space-y-3">
          {[
            { label: 'Role-Based Access Control', desc: 'Limit access by user role' },
            { label: 'Audit Trail', desc: 'Log all critical actions' },
            { label: 'Session Timeout', desc: 'Auto-logout after inactivity' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div>
                <div className="text-[#A7B5C7] text-sm">{s.label}</div>
                <div className="text-[#718198] text-xs">{s.desc}</div>
              </div>
              <button className="w-10 h-5 bg-cyan-500 rounded-full relative">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, icon: Icon, children }: any) {
  return (
    <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <Icon size={15} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white text-sm font-semibold">{title}</h3>
          <p className="text-[#718198] text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
