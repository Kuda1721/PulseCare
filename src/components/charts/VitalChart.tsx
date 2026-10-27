import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { VitalHistory } from '../../data/mockData';

interface Props {
  data: VitalHistory[];
  dataKey: keyof VitalHistory;
  color: string;
  unit: string;
  label: string;
  domain?: [number | 'auto', number | 'auto'];
  timeRange?: number;
}

export function VitalChart({ data, dataKey, color, unit, label, domain, timeRange = 48 }: Props) {
  const sliced = data.slice(-timeRange);
  const gradId = `grad-${dataKey}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0B1728] border border-white/[0.10] rounded-xl px-3 py-2 shadow-2xl">
        <div className="text-[#718198] text-[10px] mb-1">{label}</div>
        <div className="text-white text-sm font-semibold font-mono">
          {payload[0].value} <span className="text-[#718198] text-xs font-normal">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={sliced} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="time" tick={{ fill: '#718198', fontSize: 9 }}
          tickLine={false} axisLine={false}
          interval={Math.floor(sliced.length / 4)} />
        <YAxis domain={domain || ['auto', 'auto']} tick={{ fill: '#718198', fontSize: 9 }}
          tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
        <Area type="monotone" dataKey={dataKey as string}
          stroke={color} strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false} activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          animationDuration={300}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniSparkline({ data, dataKey, color }: { data: VitalHistory[]; dataKey: keyof VitalHistory; color: string }) {
  const gradId = `mini-${dataKey}-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data.slice(-20)} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey as string}
          stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`}
          dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
