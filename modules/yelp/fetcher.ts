import type { YelpData, YelpBusiness, YelpReview } from './types';

export async function testConnection(apiKey: string, businessId: string): Promise<void> {
  const response = await fetch(`https://api.yelp.com/v3/businesses/${businessId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`Yelp auth failed: ${response.status}`);
}

/**
 * Fetch data from Yelp Fusion API.
 * Returns business rating, review count, and recent reviews.
 */
export async function fetchData(apiKey: string, businessId: string): Promise<YelpData> {
  const baseUrl = 'https://api.yelp.com/v3/businesses';
  
  // 1. Fetch business details for rating and total count
  const businessRes = await fetch(`${baseUrl}/${businessId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'accept': 'application/json',
    },
  });

  if (!businessRes.ok) {
    const errorText = await businessRes.text();
    throw new Error(`Yelp API Error (Business): ${businessRes.status} - ${errorText}`);
  }

  const business: YelpBusiness = await businessRes.json();

  // 2. Fetch recent reviews
  const reviewsRes = await fetch(`${baseUrl}/${businessId}/reviews?limit=3&sort_by=newest`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'accept': 'application/json',
    },
  });

  if (!reviewsRes.ok) {
    // If reviews fail, we still have business data, but we'll throw to be consistent
    const errorText = await reviewsRes.text();
    throw new Error(`Yelp API Error (Reviews): ${reviewsRes.status} - ${errorText}`);
  }

  const reviewsData = await reviewsRes.json();
  const recentReviews: YelpReview[] = reviewsData.reviews || [];

  // Calculate new reviews in last 30 days among the returned ones (limited but better than 0)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newReviewsLast30Days = recentReviews.filter(r => {
    const created = new Date(r.time_created);
    return created >= thirtyDaysAgo;
  }).length;

  return {
    rating: business.rating,
    reviewCount: business.review_count,
    newReviewsLast30Days,
    recentReviews,
  };
}
