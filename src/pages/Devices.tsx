import { Watch, Wifi, WifiOff, Battery, BatteryLow, Signal, RefreshCw } from 'lucide-react';
import { usePatientStore } from '../store/patientStore';

export function Devices() {
  const { patients } = usePatientStore();

  const connected = patients.filter(p => p.deviceStatus === 'connected').length;
  const lowBattery = patients.filter(p => p.deviceStatus === 'low_battery').length;
  const offline = patients.filter(p => p.deviceStatus === 'disconnected').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Connected" value={connected} color="text-green-400" bg="bg-green-500/10 border-green-500/20" />
        <SummaryCard label="Low Battery" value={lowBattery} color="text-amber-400" bg="bg-amber-500/10 border-amber-500/20" />
        <SummaryCard label="Offline" value={offline} color="text-red-400" bg="bg-red-500/10 border-red-500/20" />
      </div>

      <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold text-sm">All Devices</h2>
          <p className="text-[#718198] text-xs mt-0.5">PulseCare Band wearable sensors</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {patients.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${p.deviceStatus === 'connected' ? 'bg-cyan-500/10' : p.deviceStatus === 'low_battery' ? 'bg-amber-500/10' : 'bg-gray-500/10'}`}>
                  <Watch size={16} className={p.deviceStatus === 'connected' ? 'text-cyan-400' : p.deviceStatus === 'low_battery' ? 'text-amber-400' : 'text-gray-400'} />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{p.deviceId}</div>
                  <div className="text-[#718198] text-xs">{p.name} · Room {p.room}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div className="text-center hidden sm:block">
                  <div className="text-[#718198] mb-0.5">Status</div>
                  <div className={`flex items-center gap-1 font-medium ${p.deviceStatus === 'connected' ? 'text-green-400' : p.deviceStatus === 'low_battery' ? 'text-amber-400' : 'text-red-400'}`}>
                    {p.deviceStatus === 'connected' ? <><Wifi size={11} /> Connected</> : p.deviceStatus === 'low_battery' ? <><BatteryLow size={11} /> Low Battery</> : <><WifiOff size={11} /> Offline</>}
                  </div>
                </div>
                <div className="text-center hidden md:block">
                  <div className="text-[#718198] mb-0.5">Battery</div>
                  <div className={`font-medium vital-num ${p.battery < 20 ? 'text-red-400' : p.battery < 50 ? 'text-amber-400' : 'text-green-400'}`}>{p.battery}%</div>
                </div>
                <div className="text-center hidden lg:block">
                  <div className="text-[#718198] mb-0.5">Signal</div>
                  <div className="text-white font-medium">{p.signal}</div>
                </div>
                <div className="text-center hidden lg:block">
                  <div className="text-[#718198] mb-0.5">Last Sync</div>
                  <div className="text-[#A7B5C7]">{p.lastSync}</div>
                </div>
                <button className="p-1.5 hover:bg-white/5 rounded-lg text-[#718198] hover:text-white transition-all">
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, bg }: any) {
  return (
    <div className={`bg-[#0B1728] border rounded-2xl p-4 ${bg}`}>
      <div className="text-[#718198] text-xs mb-2">{label}</div>
      <div className={`font-bold text-3xl vital-num ${color}`}>{value}</div>
    </div>
  );
}
