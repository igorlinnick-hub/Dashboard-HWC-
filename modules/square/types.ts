/** Data shape for the Square connector */

export interface SquarePayment {
  id: string;
  created_at: string;
  amount_money: {
    amount: number;
    currency: string;
  };
  refunded_money?: {
    amount: number;
    currency: string;
  };
  source_type: string;
  location_id: string;
  status: string;
}

export interface DailySales {
  date: string;
  amount: number; // gross in cents
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number; // in cents
}

export interface HourlyBreakdown {
  hour: number; // 0-23
  count: number;
  amount: number; // in cents
}

/** Aggregate Square data for transformation to ConnectorResponse */
export interface SquareData {
  totalGrossSales: number; // cents
  totalRefunds: number; // cents
  transactionCount: number;
  dailySales: DailySales[];
  paymentMethods: PaymentMethodBreakdown[];
  hourlyBreakdown: HourlyBreakdown[];
}
