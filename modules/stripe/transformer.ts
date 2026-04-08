import type { StripeData } from './types';
import type { ConnectorResponse } from '@/types';

/** Convert cents to dollars */
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/** Transform raw StripeData into universal ConnectorResponse */
export function transformData(raw: StripeData): ConnectorResponse {
  const avgTransaction =
    raw.transactionCount > 0
      ? centsToDollars(Math.round(raw.netRevenue / raw.transactionCount))
      : 0;

  const refundRate =
    raw.transactionCount > 0
      ? Math.round((raw.refundCount / raw.transactionCount) * 10000) / 100
      : 0;

  return {
    metrics: [
      { key: 'grossRevenue', label: 'Gross Revenue', value: centsToDollars(raw.grossRevenue), format: 'currency' },
      { key: 'netRevenue', label: 'Net Revenue', value: centsToDollars(raw.netRevenue), format: 'currency' },
      { key: 'transactionCount', label: 'Transactions', value: raw.transactionCount, format: 'number' },
      { key: 'avgTransaction', label: 'Avg Transaction', value: avgTransaction, format: 'currency' },
      { key: 'mrr', label: 'MRR', value: centsToDollars(raw.mrr), format: 'currency' },
      { key: 'refundRate', label: 'Refund Rate', value: refundRate, format: 'percent' },
    ],
    timeseries: raw.dailyRevenue.map((d) => ({
      date: d.date,
      value: centsToDollars(d.revenue),
    })),
    breakdowns: raw.topProducts.map((p) => ({
      label: p.name,
      value: centsToDollars(p.revenue),
    })),
  };
}
