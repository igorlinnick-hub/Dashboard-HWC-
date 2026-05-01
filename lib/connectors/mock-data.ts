// ==========================================
// Realistic mock data for all connectors
// ==========================================
// Each entry's shape MUST match what the connector's transformer reads (see
// modules/<slug>/transformer.ts). Field-name drift here surfaces as a 500 in
// the data route's mock-mode and Demo-Mode branches.

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

export const mockConnectorData: Record<string, Record<string, unknown>> = {
  // Plaid sandbox-style shape — see modules/bank/transformer.ts
  bank: {
    currentBalance: 24500,
    availableBalance: 22800,
    deposits: 12300,
    withdrawals: 4100,
    cashFlow: 8200,
    transactionCount: 64,
    dailyBalance: last30Days().map((date) => ({
      date,
      amount: rand(18000, 30000),
    })),
    categorySpending: [
      { category: 'Payroll', amount: 5400 },
      { category: 'Supplies', amount: 1820 },
      { category: 'Rent', amount: 3200 },
      { category: 'Utilities', amount: 540 },
      { category: 'Marketing', amount: 1100 },
    ],
  },
  // Stripe SDK shape — see modules/stripe/transformer.ts (values in cents)
  stripe: {
    grossRevenue: 1875000,
    netRevenue: 1782000,
    transactionCount: 142,
    refundCount: 4,
    mrr: 680000,
    dailyRevenue: last7Days().map((date) => ({
      date,
      revenue: rand(150000, 420000),
    })),
    topProducts: [
      { name: 'Holistic Consult', revenue: 540000 },
      { name: 'IV Therapy Package', revenue: 318000 },
      { name: 'Mindfulness Course', revenue: 215000 },
      { name: 'Nutrition Plan', revenue: 168000 },
      { name: 'Lab Panel', revenue: 132000 },
    ],
  },
  // Square Payments shape — see modules/square/transformer.ts (values in cents)
  square: {
    totalGrossSales: 940000,
    totalRefunds: 18000,
    transactionCount: 87,
    paymentMethods: [
      { method: 'Card', amount: 712000, count: 64 },
      { method: 'Cash', amount: 168000, count: 17 },
      { method: 'Apple Pay', amount: 60000, count: 6 },
    ],
    hourlyBreakdown: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      amount: hour >= 9 && hour <= 19 ? rand(20000, 90000) : 0,
      count: hour >= 9 && hour <= 19 ? rand(3, 12) : 0,
    })),
    dailySales: last30Days().map((date) => ({
      date,
      amount: rand(20000, 60000),
    })),
  },
  // Meta Marketing API shape — see modules/meta/transformer.ts
  meta: {
    totalSpend: 3200,
    totalImpressions: 45000,
    totalClicks: 1080,
    dailySpend: last30Days().map((date) => ({
      date,
      spend: rand(60, 180),
    })),
    campaigns: [
      { name: 'Wellness Q2 Awareness', spend: 1240, impressions: 18200, clicks: 410, status: 'ACTIVE' },
      { name: 'Detox Retargeting', spend: 980, impressions: 14100, clicks: 372, status: 'ACTIVE' },
      { name: 'IV Therapy Promo', spend: 540, impressions: 7800, clicks: 184, status: 'PAUSED' },
      { name: 'Brand Lift', spend: 440, impressions: 4900, clicks: 114, status: 'ACTIVE' },
    ],
  },
  // Yelp Fusion shape — see modules/yelp/transformer.ts
  yelp: {
    rating: 4.7,
    reviewCount: 234,
    newReviewsLast30Days: 12,
    recentReviews: [
      {
        rating: 5,
        text: 'Best wellness clinic on the island. Staff knew exactly what I needed.',
        time_created: '2026-04-22 16:14:00',
        user: { name: 'Kalei H.' },
      },
      {
        rating: 5,
        text: 'IV therapy after a long flight — felt brand new in 30 minutes.',
        time_created: '2026-04-15 11:02:00',
        user: { name: 'Marcus T.' },
      },
      {
        rating: 4,
        text: 'Great experience overall, parking was a bit tight.',
        time_created: '2026-04-08 18:47:00',
        user: { name: 'Aliya R.' },
      },
    ],
  },
  // TikTok Ads shape — see modules/tiktok/transformer.ts
  tiktok: {
    totalSpend: 1800,
    totalImpressions: 380000,
    totalClicks: 11800,
    totalViews: 120000,
    totalConversions: 45,
    dailySpend: last30Days().map((date) => ({
      date,
      spend: rand(30, 120),
    })),
    campaigns: [
      { name: 'Wellness Reels', spend: 740, views: 52000, status: 'ACTIVE' },
      { name: 'Detox Funnel', spend: 620, views: 41000, status: 'ACTIVE' },
      { name: 'Mindfulness Lead-Gen', spend: 440, views: 27000, status: 'PAUSED' },
    ],
  },
  // GA4 Data API shape — see modules/google-analytics/transformer.ts
  'google-analytics': {
    sessions: 8500,
    activeUsers: 6200,
    newUsers: 2100,
    bounceRate: 42.3,
    avgSessionDuration: 185,
    dailySessions: last30Days().map((date) => ({
      date,
      sessions: rand(180, 420),
    })),
    channels: [
      { channel: 'Organic Search', sessions: 3400 },
      { channel: 'Direct', sessions: 2100 },
      { channel: 'Paid Social', sessions: 1450 },
      { channel: 'Referral', sessions: 880 },
      { channel: 'Email', sessions: 670 },
    ],
  },
};
