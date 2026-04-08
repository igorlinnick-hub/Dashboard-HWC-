import type { TikTokData } from './types';
import type { ConnectorResponse } from '@/types';

/** Transform raw TikTok data into universal ConnectorResponse */
export function transformData(raw: TikTokData): ConnectorResponse {
  const ctr = raw.totalImpressions > 0 
    ? (raw.totalClicks / raw.totalImpressions) * 100 
    : 0;

  return {
    metrics: [
      { key: 'adSpend', label: 'Ad Spend', value: raw.totalSpend, format: 'currency' },
      { key: 'videoViews', label: 'Video Views', value: raw.totalViews, format: 'number' },
      { key: 'conversions', label: 'Conversions', value: raw.totalConversions, format: 'number' },
      { key: 'ctr', label: 'CTR', value: ctr, format: 'percent' },
    ],
    timeseries: raw.dailySpend.map((p) => ({ 
      date: p.date, 
      value: p.spend 
    })),
    breakdowns: raw.campaigns.map((c) => ({
      label: c.name,
      value: c.spend,
      meta: { views: c.views, status: c.status, type: 'campaign' },
    })),
  };
}
