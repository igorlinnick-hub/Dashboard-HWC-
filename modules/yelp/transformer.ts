import type { YelpData } from './types';
import type { ConnectorResponse } from '@/types';

/** Transform raw Yelp data into universal ConnectorResponse */
export function transformData(raw: YelpData): ConnectorResponse {
  return {
    metrics: [
      { key: 'rating', label: 'Rating', value: raw.rating, format: 'rating' },
      { key: 'reviewCount', label: 'Total Reviews', value: raw.reviewCount, format: 'number' },
      { key: 'newReviews', label: 'New Reviews (30d)', value: raw.newReviewsLast30Days, format: 'number' },
    ],
    timeseries: [
      // Since Yelp Fusion API doesn't provide trend data, we return a single point for now
      { date: new Date().toISOString().split('T')[0], value: raw.rating }
    ],
    breakdowns: raw.recentReviews.map((r) => ({
      label: r.user.name,
      value: r.rating,
      meta: { 
        text: r.text, 
        date: r.time_created.split(' ')[0],
        type: 'review' 
      },
    })),
  };
}
