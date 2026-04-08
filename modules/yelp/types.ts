export interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
}

export interface YelpReview {
  id: string;
  rating: number;
  text: string;
  time_created: string;
  user: {
    name: string;
    image_url: string | null;
  };
}

export interface YelpData {
  rating: number;
  reviewCount: number;
  newReviewsLast30Days: number;
  recentReviews: YelpReview[];
}
