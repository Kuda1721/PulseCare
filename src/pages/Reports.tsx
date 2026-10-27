import { FileText, Download, Plus } from 'lucide-react';

const REPORTS = [
  { id: 1, title: 'Weekly Vital Summary', type: 'Vitals', generated: 'Sep 7, 2026', size: '2.4 MB', status: 'ready' },
  { id: 2, title: 'Alert Activity Report', type: 'Alerts', generated: 'Sep 6, 2026', size: '1.1 MB', status: 'ready' },
  { id: 3, title: 'Device Uptime Report', type: 'Devices', generated: 'Sep 5, 2026', size: '0.8 MB', status: 'ready' },
  { id: 4, title: 'Patient Monitoring Summary', type: 'Patients', generated: 'Sep 4, 2026', size: '3.2 MB', status: 'ready' },
];

export function Reports() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <p className="text-[#718198] text-sm">Generate and export clinical reports</p>
        <button className="flex items-center gap-2 px-3 py-2 bg-cyan-500 rounded-xl text-white text-sm font-medium hover:bg-cyan-400 transition-all">
          <Plus size={14} /> Generate Report
        </button>
      </div>

      <div className="bg-[#0B1728] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/[0.04]">
          {REPORTS.map(r => (
            <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/5 rounded-xl">
                  <FileText size={16} className="text-[#A7B5C7]" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{r.title}</div>
                  <div className="text-[#718198] text-xs">{r.type} · Generated {r.generated} · {r.size}</div>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.08] rounded-xl text-[#A7B5C7] text-xs hover:bg-white/5 hover:text-white transition-all">
                <Download size={11} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
