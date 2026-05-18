export type SubscriberStatus = 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';
export type AnalyticsEventType = 'page_view' | 'form_submit' | 'button_click' | 'email_open' | 'email_click' | 'social_engagement' | 'purchase' | 'signup';

export interface EmailList {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  subscriber_count: number;
  created_at: string;
}

export interface EmailSubscriber {
  id: string;
  workspace_id: string;
  list_id: string;
  contact_id: string | null;
  email: string;
  status: SubscriberStatus;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface EmailTemplate {
  id: string;
  workspace_id: string;
  name: string;
  subject_template: string | null;
  html_template: string | null;
  thumbnail_url: string | null;
  category: string | null;
  created_at: string;
}

export interface EmailSend {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced: boolean;
  bounce_reason: string | null;
  unsubscribed_at: string | null;
}

export interface CampaignAnalytics {
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

export interface AnalyticsEvent {
  id: string;
  workspace_id: string;
  event_type: AnalyticsEventType;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  contact_id: string | null;
  deal_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AnalyticsSession {
  id: string;
  workspace_id: string;
  session_id: string;
  contact_id: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  landing_page: string | null;
  referrer: string | null;
  device_type: string | null;
  browser: string | null;
  country: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  page_views: number;
  events_count: number;
}

export interface AttributionTouchpoint {
  id: string;
  workspace_id: string;
  contact_id: string;
  deal_id: string | null;
  touchpoint_type: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  attribution_weight: number | null;
  occurred_at: string;
}

export interface AnalyticsOverview {
  total_events: number;
  total_sessions: number;
  conversions: number;
  conversion_rate: number;
  total_revenue: number;
}

export interface TrafficData {
  total_sessions: number;
  by_source: { name: string; count: number }[];
  by_device: { name: string; count: number }[];
  by_country: { name: string; count: number }[];
  top_pages: { name: string; count: number }[];
}

export interface ConversionData {
  total_conversions: number;
  conversion_rate: number;
  by_type: Record<string, number>;
}

export interface RevenueData {
  total_revenue: number;
  deals_closed: number;
  avg_deal_size: number;
  pipeline_value: number;
}

export interface FunnelStep {
  step: string;
  count: number;
  conversion_rate: number;
  drop_off: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
}

export interface ROIChannel {
  source: string;
  medium: string;
  attributed_revenue: number;
}
