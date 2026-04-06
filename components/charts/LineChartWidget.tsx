'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LineChartWidgetProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
  height?: number;
}

export function LineChartWidget({
  data,
  xKey,
  yKey,
  title,
  color = '#3b82f6',
  height = 300,
}: LineChartWidgetProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {title && <h4 className="mb-4 text-sm font-medium text-gray-600">{title}</h4>}
      {data.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke={color} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
