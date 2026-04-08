import type { SquareData } from './types';
import type { ConnectorResponse, BreakdownItem } from '@/types';

/** Convert cents to dollars */
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/** Transform raw SquareData into universal ConnectorResponse */
export function transformData(raw: SquareData): ConnectorResponse {
  const avgSale = raw.transactionCount > 0 
    ? raw.totalGrossSales / raw.transactionCount 
    : 0;

  const breakdowns: BreakdownItem[] = [
    // Payment Methods
    ...raw.paymentMethods.map(m => ({
      label: m.method,
      value: centsToDollars(m.amount),
      meta: { type: 'method', count: m.count }
    })),
    // Busiest Hours
    ...raw.hourlyBreakdown
      .filter(h => h.count > 0) // only show hours with activity
      .map(h => ({
        label: `${h.hour}:00`,
        value: h.count, // for the busiest hours, show transaction count as the primary value
        meta: { type: 'hour', amount: centsToDollars(h.amount) }
      }))
  ];

  return {
    metrics: [
      { key: 'totalGrossSales', label: 'Total Sales', value: centsToDollars(raw.totalGrossSales), format: 'currency' },
      { key: 'transactionCount', label: 'Transactions', value: raw.transactionCount, format: 'number' },
      { key: 'avgSale', label: 'Avg Sale', value: centsToDollars(avgSale), format: 'currency' },
      { key: 'totalRefunds', label: 'Refunds', value: centsToDollars(raw.totalRefunds), format: 'currency' },
    ],
    timeseries: raw.dailySales.map((d) => ({
      date: d.date,
      value: centsToDollars(d.amount),
    })),
    breakdowns,
  };
}
