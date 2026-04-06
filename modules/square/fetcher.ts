import type { SquareData } from './types';

/** Fetch payment/order data from Square API */
export async function fetchData(): Promise<SquareData> {
  // TODO: read SQUARE_ACCESS_TOKEN from process.env
  // TODO: call Square /v2/payments and /v2/orders/search
  // Returns mock data for now
  return {
    totalSales: 9400,
    transactions: 87,
    avgTicket: 108,
    topServices: [],
  };
}
