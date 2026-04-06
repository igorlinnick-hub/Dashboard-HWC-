/** Data shape for the Stripe connector */
export interface StripeData {
  /** Total revenue in cents, last 30 days */
  totalRevenue: number;
  /** Number of successful transactions, last 30 days */
  transactionCount: number;
  /** Monthly recurring revenue in cents (from active subscriptions) */
  mrr: number;
  /** Daily revenue for last 7 days — for chart */
  revenueChart: DailyRevenue[];
}

export interface DailyRevenue {
  date: string;   // YYYY-MM-DD
  revenue: number; // cents
}

/** Raw credentials stored in connector_credentials table */
export interface StripeCredentials {
  apiKey: string;
}
