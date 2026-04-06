import Stripe from 'stripe';
import type { StripeData, DailyRevenue } from './types';

/**
 * Fetch real Stripe data using the client's API key.
 * Returns: totalRevenue (30d), transactionCount (30d), MRR, last 7 days chart.
 */
export async function fetchData(apiKey: string): Promise<StripeData> {
  const stripe = new Stripe(apiKey, { apiVersion: '2025-04-30.basil' });

  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60;

  // --- 30-day revenue & transaction count ---
  let totalRevenue = 0;
  let transactionCount = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const charges: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const charge of charges.data) {
      if (charge.status === 'succeeded' && !charge.refunded) {
        totalRevenue += charge.amount;
        transactionCount += 1;
      }
    }

    hasMore = charges.has_more;
    if (charges.data.length > 0) {
      startingAfter = charges.data[charges.data.length - 1].id;
    }
  }

  // --- MRR from active subscriptions ---
  let mrr = 0;
  let subHasMore = true;
  let subStartingAfter: string | undefined;

  while (subHasMore) {
    const subs: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      ...(subStartingAfter ? { starting_after: subStartingAfter } : {}),
    });

    for (const sub of subs.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        if (price.recurring?.interval === 'month') {
          mrr += (price.unit_amount ?? 0) * (item.quantity ?? 1);
        } else if (price.recurring?.interval === 'year') {
          mrr += Math.round(((price.unit_amount ?? 0) * (item.quantity ?? 1)) / 12);
        }
      }
    }

    subHasMore = subs.has_more;
    if (subs.data.length > 0) {
      subStartingAfter = subs.data[subs.data.length - 1].id;
    }
  }

  // --- Last 7 days daily revenue for chart ---
  const dailyMap = new Map<string, number>();

  // Initialize all 7 days to 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date((now - i * 24 * 60 * 60) * 1000);
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }

  let chartHasMore = true;
  let chartStartingAfter: string | undefined;

  while (chartHasMore) {
    const charges: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
      created: { gte: sevenDaysAgo },
      limit: 100,
      ...(chartStartingAfter ? { starting_after: chartStartingAfter } : {}),
    });

    for (const charge of charges.data) {
      if (charge.status === 'succeeded' && !charge.refunded) {
        const day = new Date(charge.created * 1000).toISOString().split('T')[0];
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + charge.amount);
      }
    }

    chartHasMore = charges.has_more;
    if (charges.data.length > 0) {
      chartStartingAfter = charges.data[charges.data.length - 1].id;
    }
  }

  const revenueChart: DailyRevenue[] = Array.from(dailyMap.entries()).map(
    ([date, revenue]) => ({ date, revenue })
  );

  return { totalRevenue, transactionCount, mrr, revenueChart };
}
