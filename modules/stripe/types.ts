/** Data shape for the Stripe connector */
export interface StripeData {
  /** Gross revenue in cents (all succeeded charges including refunded) */
  grossRevenue: number;
  /** Net revenue in cents (succeeded minus refunded amounts) */
  netRevenue: number;
  /** Number of succeeded charges */
  transactionCount: number;
  /** Number of refunded charges */
  refundCount: number;
  /** Total refunded amount in cents */
  refundedAmount: number;
  /** Monthly recurring revenue in cents (from active subscriptions) */
  mrr: number;
  /** Daily revenue for timeseries chart — keyed by YYYY-MM-DD, value in cents */
  dailyRevenue: DailyRevenue[];
  /** Top products by revenue */
  topProducts: ProductBreakdown[];
}

export interface DailyRevenue {
  date: string;   // YYYY-MM-DD
  revenue: number; // cents (net)
}

export interface ProductBreakdown {
  name: string;
  revenue: number; // cents
}

/** Raw credentials stored in connector_credentials table */
export interface StripeCredentials {
  apiKey: string;
}
