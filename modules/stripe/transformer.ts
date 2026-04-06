import type { StripeData } from './types';
import type { BaseMetric } from '@/types';

/** Convert cents to dollars */
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/** Transform raw StripeData into display-ready format */
export function transformData(raw: StripeData) {
  return {
    totalRevenue: centsToDollars(raw.totalRevenue),
    transactionCount: raw.transactionCount,
    mrr: centsToDollars(raw.mrr),
    revenueChart: raw.revenueChart.map((d) => ({
      date: d.date,
      revenue: centsToDollars(d.revenue),
    })),
  };
}

/** Convert a single value into BaseMetric format */
export function toBaseMetric(value: number, previousValue?: number): BaseMetric {
  const change = previousValue !== undefined ? value - previousValue : 0;
  const changePercent = previousValue && previousValue !== 0
    ? (change / previousValue) * 100
    : 0;

  return {
    value,
    change,
    changePercent,
    lastUpdated: new Date().toISOString(),
  };
}
