/** Data shape for the Google Analytics (GA4) connector */
export interface GAData {
  sessions: number;
  activeUsers: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  /** Daily sessions for timeseries */
  dailySessions: GADailyRow[];
  /** Traffic channels for breakdown */
  channels: GAChannelRow[];
}

export interface GADailyRow {
  date: string; // YYYY-MM-DD
  sessions: number;
}

export interface GAChannelRow {
  channel: string; // Organic Search, Paid Search, Direct, Social, Referral, etc.
  sessions: number;
}

/** GA4 Data API response shapes */
export interface GA4RunReportResponse {
  rows?: GA4Row[];
  totals?: GA4Row[];
  rowCount?: number;
}

export interface GA4Row {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}
