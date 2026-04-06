/** Data shape for the Meta (Facebook/Instagram Ads) connector */
export interface MetaData {
  adSpend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  costPerConversion: number;
  campaigns: MetaCampaign[];
}

export interface MetaCampaign {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  status: string;
}
