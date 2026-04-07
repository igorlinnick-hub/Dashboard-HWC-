// ==========================================
// Realistic mock data for all connectors
// ==========================================

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
  bank: {
    balance: 24500,
    deposits: 12300,
    cashFlow: 8200,
    chart: last30Days().map((date) => ({
      date,
      balance: rand(18000, 30000),
    })),
  },
  stripe: {
    totalRevenue: 18750,
    transactionCount: 142,
    mrr: 6800,
    revenueChart: last7Days().map((date) => ({
      date,
      revenue: rand(1500, 4200),
    })),
  },
  square: {
    totalSales: 9400,
    transactions: 87,
    avgTicket: 108,
    chart: last30Days().map((date) => ({
      date,
      sales: rand(200, 600),
    })),
  },
  meta: {
    adSpend: 3200,
    impressions: 45000,
    ctr: 2.4,
    costPerConversion: 42,
    chart: last30Days().map((date) => ({
      date,
      spend: rand(60, 180),
      conversions: rand(1, 8),
    })),
  },
  yelp: {
    rating: 4.7,
    reviewCount: 234,
    newReviews: 12,
    chart: last30Days().map((date) => ({
      date,
      rating: +(4.2 + Math.random() * 0.8).toFixed(1),
      reviews: rand(0, 3),
    })),
  },
  tiktok: {
    adSpend: 1800,
    videoViews: 120000,
    conversions: 45,
    ctr: 3.1,
    chart: last30Days().map((date) => ({
      date,
      spend: rand(30, 120),
      views: rand(2000, 8000),
    })),
  },
  'google-analytics': {
    sessions: 8500,
    users: 6200,
    bounceRate: 42.3,
    avgDuration: 185,
    chart: last30Days().map((date) => ({
      date,
      sessions: rand(180, 420),
      users: rand(120, 320),
    })),
  },
};
