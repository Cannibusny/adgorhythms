export interface AiLeadInsight {
  id: string;
  contact_id: string;
  score: number;
  score_explanation: string;
  predicted_conversion_probability: number;
  predicted_close_date: string;
  suggested_actions: string[];
  calculated_at: string;
  contacts?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    lifecycle_stage: string;
  };
}

export interface CustomerJourney {
  id: string;
  contact_id: string;
  journey_map: JourneyStep[];
  drop_off_points: DropOffPoint[];
  suggested_improvements: string[];
  analyzed_at: string;
}

export interface JourneyStep {
  stage: string;
  channel: string;
  action: string;
  date: string;
  engagement: string;
}

export interface DropOffPoint {
  stage: string;
  percentage: number;
  reason: string;
  suggestion: string;
  count?: number;
  avgPercentage?: number;
  reasons?: string[];
  suggestions?: string[];
}

export interface CompetitorIntelUpdate {
  id: string;
  workspace_id: string;
  competitor_name: string;
  update_type: 'pricing_change' | 'new_feature' | 'ad_campaign' | 'content_published' | 'social_activity';
  details: string;
  ai_recommendation: string;
  detected_at: string;
}

export interface CompetitorAnalysis {
  competitor_name: string;
  overall_threat_level: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  market_position: string;
  recommended_actions: string[];
}

export interface AdExperiment {
  id: string;
  workspace_id: string;
  platform: string;
  campaign_name: string;
  variations: AdVariation[];
  current_winner: AdVariation | null;
  budget_allocated: number;
  cpa: number;
  status: 'running' | 'paused' | 'completed';
  started_at: string;
}

export interface AdVariation {
  id: string;
  headline?: string;
  body?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  score?: number;
  budget_percentage?: number;
  new_budget?: number;
}

export interface SalesCallAnalysis {
  id: string;
  workspace_id: string;
  deal_id: string | null;
  call_transcript: string;
  call_score: number;
  talk_ratio: number;
  objections_identified: CallObjection[];
  buying_signals: BuyingSignal[];
  coaching_suggestions: string[];
  analyzed_at: string;
}

export interface CallObjection {
  objection: string;
  response_quality: string;
  timestamp: string;
  suggestion: string;
}

export interface BuyingSignal {
  signal: string;
  strength: string;
  timestamp: string;
}

export interface ChurnPrediction {
  id: string;
  contact_id: string;
  churn_risk: number;
  risk_factors: RiskFactor[];
  win_back_strategy: string;
  predicted_at: string;
  contacts?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    lifecycle_stage: string;
  };
}

export interface RiskFactor {
  factor: string;
  impact: string;
  detail: string;
}

export interface WinBackCampaign {
  contact_id: string;
  contact_name: string;
  email_sequence: { day: number; subject: string; body: string }[];
  sms_message: string;
  retargeting_ad: { headline: string; body: string; cta: string };
}

export interface RoiCalculation {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  channel: string;
  spend: number;
  revenue_attributed: number;
  roi_percentage: number;
  calculated_at: string;
}

export interface RoiByChannel {
  channel: string;
  total_spend: number;
  total_revenue: number;
  roi_percentage: number;
  cac: number;
  entries: number;
}

export interface RoiTrend {
  month: string;
  spend: number;
  revenue: number;
  roi_percentage: number;
  count: number;
}

export interface SchemaLibraryItem {
  id: string;
  workspace_id: string;
  name: string;
  schema_type: string;
  schema_data: Record<string, unknown>;
  script_tag: string;
  created_at: string;
}

export interface AdRecommendation {
  experiment_id: string;
  campaign_name: string;
  platform: string;
  recommendation: string;
  current_cpa: number | null;
  projected_savings: number;
}
