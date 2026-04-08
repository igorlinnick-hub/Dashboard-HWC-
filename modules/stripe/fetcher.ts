import Stripe from 'stripe';
import type { StripeData, DailyRevenue, ProductBreakdown } from './types';

/**
 * Fetch real Stripe data for a given period.
 * @param apiKey — Stripe secret key
 * @param from — YYYY-MM-DD start date
 * @param to — YYYY-MM-DD end date
 */
export async function fetchData(
  apiKey: string,
  from: string,
  to: string
): Promise<StripeData> {
  const stripe = new Stripe(apiKey, { apiVersion: '2025-04-30.basil' });

  const gteTs = Math.floor(new Date(from).getTime() / 1000);
  // End of "to" day
  const lteTs = Math.floor(new Date(to + 'T23:59:59Z').getTime() / 1000);

  // --- Fetch all charges in the period ---
  const charges: Stripe.Charge[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const page: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
      created: { gte: gteTs, lte: lteTs },
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    charges.push(...page.data);
    hasMore = page.has_more;
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    }
  }

  // --- Compute metrics from charges ---
  let grossRevenue = 0;
  let netRevenue = 0;
  let transactionCount = 0;
  let refundCount = 0;
  let refundedAmount = 0;

  const dailyMap = new Map<string, number>();
  const productMap = new Map<string, number>();

  // Initialize daily map with all dates in range
  const startDate = new Date(from);
  const endDate = new Date(to);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }

  for (const charge of charges) {
    if (charge.status !== 'succeeded') continue;

    const amount = charge.amount;
    grossRevenue += amount;
    transactionCount += 1;

    if (charge.refunded) {
      refundCount += 1;
      refundedAmount += charge.amount_refunded;
      netRevenue += amount - charge.amount_refunded;
    } else {
      netRevenue += amount;
    }

    // Daily grouping (net per charge)
    const day = new Date(charge.created * 1000).toISOString().split('T')[0];
    const chargeNet = charge.refunded ? amount - charge.amount_refunded : amount;
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + chargeNet);

    // Product grouping by description
    const productName = charge.description || 'Other';
    productMap.set(productName, (productMap.get(productName) ?? 0) + chargeNet);
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

  // --- Build outputs ---
  const dailyRevenue: DailyRevenue[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  const topProducts: ProductBreakdown[] = Array.from(productMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue }));

  return {
    grossRevenue,
    netRevenue,
    transactionCount,
    refundCount,
    refundedAmount,
    mrr,
    dailyRevenue,
    topProducts,
  };
}
