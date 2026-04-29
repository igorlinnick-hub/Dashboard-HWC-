export interface MetaData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  dailySpend: { date: string; spend: number }[];
  campaigns: {
    id: string;
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    status: string;
  }[];
}
