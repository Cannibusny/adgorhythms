-- Phase 6: AI Enhancements Schema
-- Requires Phase 1-5 tables

-- Schema Library (for Schema Markup Generator - Phase 5 addition)
create table schema_library (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  schema_type text not null,
  schema_data jsonb,
  script_tag text,
  created_at timestamptz default now()
);

-- AI Lead Insights
create table ai_lead_insights (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  score integer check (score between 0 and 100),
  score_explanation text,
  predicted_conversion_probability decimal(5,2),
  predicted_close_date date,
  suggested_actions jsonb,
  calculated_at timestamptz default now()
);

-- Customer Journeys
create table customer_journeys (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  journey_map jsonb,
  drop_off_points jsonb,
  suggested_improvements jsonb,
  analyzed_at timestamptz default now()
);

-- Competitor Intel Updates
create table competitor_intel_updates (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  competitor_name text,
  update_type text check (update_type in ('pricing_change', 'new_feature', 'ad_campaign', 'content_published', 'social_activity')),
  details text,
  ai_recommendation text,
  detected_at timestamptz default now()
);

-- Ad Experiments
create table ad_experiments (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  platform text,
  campaign_name text,
  variations jsonb,
  current_winner jsonb,
  budget_allocated decimal(10,2),
  cpa decimal(10,2),
  status text check (status in ('running', 'paused', 'completed')) default 'running',
  started_at timestamptz default now()
);

-- Sales Call Analyses
create table sales_call_analyses (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  deal_id uuid references deals(id),
  call_transcript text,
  call_score integer check (call_score between 0 and 100),
  talk_ratio decimal(5,2),
  objections_identified jsonb,
  buying_signals jsonb,
  coaching_suggestions jsonb,
  analyzed_at timestamptz default now()
);

-- Churn Predictions
create table churn_predictions (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  churn_risk integer check (churn_risk between 0 and 100),
  risk_factors jsonb,
  win_back_strategy text,
  predicted_at timestamptz default now()
);

-- ROI Calculations
create table roi_calculations (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  campaign_id text,
  channel text,
  spend decimal(12,2),
  revenue_attributed decimal(12,2),
  roi_percentage decimal(10,2),
  calculated_at timestamptz default now()
);

-- Indexes
create index idx_schema_library_workspace on schema_library(workspace_id);
create index idx_lead_insights_contact on ai_lead_insights(contact_id);
create index idx_journeys_contact on customer_journeys(contact_id);
create index idx_intel_workspace on competitor_intel_updates(workspace_id);
create index idx_experiments_workspace on ad_experiments(workspace_id);
create index idx_call_analyses_deal on sales_call_analyses(deal_id);
create index idx_churn_contact on churn_predictions(contact_id);
create index idx_roi_workspace on roi_calculations(workspace_id);
