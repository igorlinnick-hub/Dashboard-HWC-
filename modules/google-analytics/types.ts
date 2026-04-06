/** Data shape for the Google Analytics (GA4) connector */
export interface GAData {
  sessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: GAPageView[];
}

export interface GAPageView {
  path: string;
  views: number;
  avgTime: number;
}
