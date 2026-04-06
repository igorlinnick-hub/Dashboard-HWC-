/** Data shape for the Yelp connector */
export interface YelpData {
  rating: number;
  reviewCount: number;
  newReviews: number;
  recentReviews: YelpReview[];
}

export interface YelpReview {
  id: string;
  rating: number;
  text: string;
  date: string;
  userName: string;
}
