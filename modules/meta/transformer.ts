import type { MetaData } from './types';
import type { ConnectorResponse } from '@/types';

/** Transform raw Meta data into universal ConnectorResponse */
export function transformData(raw: MetaData): ConnectorResponse {
  const ctr = raw.totalImpressions > 0 
    ? (raw.totalClicks / raw.totalImpressions) * 100 
    : 0;
    
  const cpc = raw.totalClicks > 0 
    ? raw.totalSpend / raw.totalClicks 
    : 0;

  return {
    metrics: [
      { key: 'adSpend', label: 'Ad Spend', value: raw.totalSpend, format: 'currency' },
      { key: 'impressions', label: 'Impressions', value: raw.totalImpressions, format: 'number' },
      { key: 'ctr', label: 'CTR', value: ctr, format: 'percent' },
      { key: 'costPerClick', label: 'CPC', value: cpc, format: 'currency' },
    ],
    timeseries: raw.dailySpend.map((p) => ({ 
      date: p.date, 
      value: p.spend 
    })),
    breakdowns: raw.campaigns.map((c) => ({
      label: c.name,
      value: c.spend,
      meta: { impressions: c.impressions, clicks: c.clicks, status: c.status, type: 'campaign' },
    })),
  };
}
