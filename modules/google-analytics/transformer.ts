import type { GAData } from './types';
import type { ConnectorResponse } from '@/types';

/** Transform raw GA4 data into universal ConnectorResponse */
export function transformData(raw: GAData): ConnectorResponse {
  const newUserPercent =
    raw.activeUsers > 0
      ? Math.round((raw.newUsers / raw.activeUsers) * 10000) / 100
      : 0;

  return {
    metrics: [
      { key: 'sessions', label: 'Sessions', value: raw.sessions, format: 'number' },
      { key: 'activeUsers', label: 'Users', value: raw.activeUsers, format: 'number' },
      { key: 'newUserPercent', label: 'New Users', value: newUserPercent, format: 'percent' },
      { key: 'bounceRate', label: 'Bounce Rate', value: Math.round(raw.bounceRate * 100) / 100, format: 'percent' },
      { key: 'avgDuration', label: 'Avg Duration', value: Math.round(raw.avgSessionDuration), format: 'duration' },
    ],
    timeseries: raw.dailySessions.map((d) => ({
      date: d.date,
      value: d.sessions,
    })),
    breakdowns: raw.channels.map((c) => ({
      label: c.channel,
      value: c.sessions,
    })),
  };
}
