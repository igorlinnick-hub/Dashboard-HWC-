/** Data shape for the TikTok Ads connector */
export interface TikTokData {
  adSpend: number;
  videoViews: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion: number;
  campaigns: TikTokCampaign[];
}

export interface TikTokCampaign {
  id: string;
  name: string;
  spend: number;
  views: number;
  status: string;
}
