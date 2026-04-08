/** Data shape for the Bank (Plaid) connector */
export interface BankData {
  /** Current balance in dollars */
  currentBalance: number;
  /** Available balance in dollars */
  availableBalance: number;
  /** Total deposits (credits) in period, dollars */
  deposits: number;
  /** Total withdrawals (debits) in period, dollars */
  withdrawals: number;
  /** Net cash flow (deposits - withdrawals) */
  cashFlow: number;
  /** Number of transactions in period */
  transactionCount: number;
  /** Daily balance for timeseries */
  dailyBalance: BankDailyRow[];
  /** Spending by category for breakdown */
  categorySpending: BankCategoryRow[];
}

export interface BankDailyRow {
  date: string; // YYYY-MM-DD
  amount: number; // net flow for the day in dollars
}

export interface BankCategoryRow {
  category: string;
  amount: number; // dollars
}
