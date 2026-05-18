export interface ReviewMonitor {
  id: string;
  workspace_id: string;
  platform: string;
  business_url: string;
  last_checked: string;
  active: boolean;
}

export interface Review {
  id: string;
  workspace_id: string;
  platform: string;
  platform_review_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  responded: boolean;
  response_text: string | null;
  responded_at: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  ai_draft: string;
  final_response: string | null;
  posted: boolean;
  posted_at: string | null;
  created_at: string;
}

export interface RecoveryCampaign {
  id: string;
  review_id: string;
  customer_email: string;
  campaign_type: string;
  offer_text: string;
  sent_at: string;
  recovered: boolean;
  updated_rating: number | null;
}

export interface ReviewStats {
  total_reviews: number;
  avg_rating: number;
  response_rate: number;
  sentiment: { positive: number; neutral: number; negative: number };
  by_platform: Record<string, number>;
}

export interface ReviewTrend {
  month: string;
  avg_rating: string;
  review_count: number;
}

export interface ReviewCompetitor {
  name: string;
  avg_rating: string;
  total_reviews: number;
  response_rate: number;
}

export interface RequestStats {
  total_sent: number;
  opened: number;
  reviews_posted: number;
  conversion_rate: string;
}
