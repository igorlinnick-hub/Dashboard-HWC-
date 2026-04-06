import type { GAData } from './types';

/** Fetch analytics from GA4 Data API */
export async function fetchData(): Promise<GAData> {
  // TODO: read GA_PROPERTY_ID and GOOGLE_CLIENT_ID from process.env
  // TODO: call GA4 Data API v1beta /properties/{id}:runReport
  // Returns mock data for now
  return {
    sessions: 8500,
    users: 6200,
    newUsers: 3100,
    pageViews: 22000,
    bounceRate: 42.3,
    avgSessionDuration: 185,
    topPages: [],
  };
}
