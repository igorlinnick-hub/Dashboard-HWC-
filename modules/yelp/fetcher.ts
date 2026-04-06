import type { YelpData } from './types';

/** Fetch reviews from Yelp Fusion API */
export async function fetchData(): Promise<YelpData> {
  // TODO: read YELP_API_KEY from process.env
  // TODO: call Yelp Fusion API /v3/businesses/{id}/reviews
  // Returns mock data for now
  return {
    rating: 4.7,
    reviewCount: 234,
    newReviews: 12,
    recentReviews: [],
  };
}
