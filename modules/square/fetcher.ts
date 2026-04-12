import type { SquareData, SquarePayment, DailySales, PaymentMethodBreakdown, HourlyBreakdown } from './types';

export async function testConnection(accessToken: string, locationId: string): Promise<void> {
  const response = await fetch(`https://connect.squareup.com/v2/locations/${locationId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Square-Version': '2025-02-13' },
  });
  if (!response.ok) throw new Error(`Square auth failed: ${response.status}`);
}

/**
 * Fetch real payment data from Square API.
 * Handles pagination and aggregates data for the dashboard.
 */
export async function fetchData(
  accessToken: string,
  locationId: string,
  from: string, // YYYY-MM-DD
  to: string    // YYYY-MM-DD
): Promise<SquareData> {
  const baseUrl = 'https://connect.squareup.com/v2/payments';
  
  // Convert YYYY-MM-DD to RFC 3339
  const beginTime = `${from}T00:00:00Z`;
  const endTime = `${to}T23:59:59Z`;

  const payments: SquarePayment[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(baseUrl);
    url.searchParams.set('begin_time', beginTime);
    url.searchParams.set('end_time', endTime);
    url.searchParams.set('location_id', locationId);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2025-02-13',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.payments) {
      payments.push(...data.payments);
    }

    cursor = data.cursor;
    hasMore = !!cursor;
  }

  // --- Aggregate Data ---
  let totalGrossSales = 0;
  let totalRefunds = 0;
  
  const dailyMap = new Map<string, number>();
  const methodMap = new Map<string, { count: number; amount: number }>();
  const hourlyMap = new Map<number, { count: number; amount: number }>();

  // Initialize hourly map (0-23)
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { count: 0, amount: 0 });
  }

  // Initialize daily map for all dates in range
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }

  for (const p of payments) {
    // Square payments can be COMPLETED, APPROVED, etc.
    // We count anything that successfully moved money.
    if (p.status === 'COMPLETED' || p.status === 'APPROVED') {
      const amount = p.amount_money.amount;
      const refund = p.refunded_money?.amount ?? 0;
      
      totalGrossSales += amount;
      totalRefunds += refund;

      // Daily trend
      const date = p.created_at.split('T')[0];
      if (dailyMap.has(date)) {
        dailyMap.set(date, (dailyMap.get(date) || 0) + amount);
      }

      // Method breakdown
      const method = p.source_type || 'UNKNOWN';
      const mData = methodMap.get(method) || { count: 0, amount: 0 };
      methodMap.set(method, { 
        count: mData.count + 1, 
        amount: mData.amount + amount 
      });

      // Hourly breakdown
      const hour = new Date(p.created_at).getUTCHours();
      const hData = hourlyMap.get(hour)!;
      hourlyMap.set(hour, {
        count: hData.count + 1,
        amount: hData.amount + amount
      });
    }
  }

  const dailySales: DailySales[] = Array.from(dailyMap.entries()).map(([date, amount]) => ({
    date,
    amount
  }));

  const paymentMethods: PaymentMethodBreakdown[] = Array.from(methodMap.entries()).map(([method, data]) => ({
    method,
    ...data
  }));

  const hourlyBreakdown: HourlyBreakdown[] = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    ...data
  }));

  return {
    totalGrossSales,
    totalRefunds,
    transactionCount: payments.length,
    dailySales,
    paymentMethods,
    hourlyBreakdown
  };
}
