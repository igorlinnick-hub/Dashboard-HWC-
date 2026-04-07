'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartWidgetProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
  height?: number;
}

export function BarChartWidget({
  data,
  xKey,
  yKey,
  title,
  color = '#F97316',
  height = 300,
}: BarChartWidgetProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5">
      {title && <h4 className="mb-4 text-sm font-medium text-text-secondary">{title}</h4>}
      {data.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-text-muted">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid stroke="#1A1A1A" strokeDasharray="none" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="#52525B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#52525B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid #1A1A1A',
                borderRadius: '8px',
                color: '#FAFAFA',
                fontSize: '13px',
              }}
            />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
