-- Phase 6 LuxeFlow: Universal Review Intelligence
-- Run AFTER phase6-ai-enhancements-schema.sql

-- Review Monitoring
create table review_monitoring (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  platform text check (platform in ('google', 'yelp', 'facebook', 'trustpilot', 'bbb', 'g2', 'capterra', 'tripadvisor', 'weedmaps')) not null,
  business_url text not null,
  last_checked timestamptz default now(),
  active boolean default true
);

create index idx_review_monitoring_workspace on review_monitoring(workspace_id);

-- Reviews
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  platform text not null,
  platform_review_id text unique,
  reviewer_name text,
  rating integer check (rating between 1 and 5),
  review_text text,
  review_date date,
  responded boolean default false,
  response_text text,
  responded_at timestamptz,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamptz default now()
);

create index idx_reviews_workspace on reviews(workspace_id);
create index idx_reviews_platform on reviews(platform);
create index idx_reviews_rating on reviews(rating);
create index idx_reviews_sentiment on reviews(sentiment);

-- Review Responses
create table review_responses (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references reviews(id) on delete cascade,
  ai_draft text,
  final_response text,
  posted boolean default false,
  posted_at timestamptz,
  created_at timestamptz default now()
);

create index idx_review_responses_review on review_responses(review_id);

-- Review Recovery Campaigns
create table review_recovery_campaigns (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references reviews(id) on delete cascade,
  customer_email text,
  campaign_type text,
  offer_text text,
  sent_at timestamptz,
  recovered boolean default false,
  updated_rating integer
);

create index idx_review_recovery_review on review_recovery_campaigns(review_id);
