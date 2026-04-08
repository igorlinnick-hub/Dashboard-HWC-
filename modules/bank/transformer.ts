import type { BankData } from './types';
import type { ConnectorResponse } from '@/types';

/** Transform raw Plaid bank data into universal ConnectorResponse */
export function transformData(raw: BankData): ConnectorResponse {
  return {
    metrics: [
      { key: 'currentBalance', label: 'Balance', value: raw.currentBalance, format: 'currency' },
      { key: 'deposits', label: 'Deposits', value: raw.deposits, format: 'currency' },
      { key: 'withdrawals', label: 'Withdrawals', value: raw.withdrawals, format: 'currency' },
      { key: 'cashFlow', label: 'Cash Flow', value: raw.cashFlow, format: 'currency' },
      { key: 'transactionCount', label: 'Transactions', value: raw.transactionCount, format: 'number' },
      { key: 'availableBalance', label: 'Available', value: raw.availableBalance, format: 'currency' },
    ],
    timeseries: raw.dailyBalance.map((d) => ({
      date: d.date,
      value: d.amount,
    })),
    breakdowns: raw.categorySpending.map((c) => ({
      label: c.category,
      value: c.amount,
    })),
  };
}
