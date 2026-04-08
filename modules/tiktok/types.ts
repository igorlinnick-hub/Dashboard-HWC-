export interface SupermetricsRow {
  date: string;
  campaign_name?: string;
  campaign_id?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  video_views?: number;
}

export interface TikTokData {
  totalSpend: number;
  totalViews: number;
  totalConversions: number;
  totalClicks: number;
  totalImpressions: number;
  dailySpend: { date: string; spend: number }[];
  campaigns: {
    id: string;
    name: string;
    spend: number;
    views: number;
    status: string;
  }[];
}
