-- Phase 4: Email Marketing + Analytics Schema
-- Run AFTER Phase 1, 2, and 3 migrations

create table email_lists (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  subscriber_count integer default 0,
  created_at timestamptz default now()
);

create table email_subscribers (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  list_id uuid references email_lists(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  email text not null,
  status text check (status in ('subscribed', 'unsubscribed', 'bounced', 'complained')) default 'subscribed',
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz,
  unique(list_id, email)
);

create table email_templates (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  subject_template text,
  html_template text,
  thumbnail_url text,
  category text,
  created_at timestamptz default now()
);

create table email_sends (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references email_campaigns(id) on delete cascade,
  subscriber_id uuid references email_subscribers(id) on delete cascade,
  sent_at timestamptz default now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced boolean default false,
  bounce_reason text,
  unsubscribed_at timestamptz
);

create table analytics_events (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  event_type text check (event_type in ('page_view', 'form_submit', 'button_click', 'email_open', 'email_click', 'social_engagement', 'purchase', 'signup')) not null,
  source text,
  medium text,
  campaign text,
  contact_id uuid references contacts(id),
  deal_id uuid references deals(id),
  metadata jsonb,
  created_at timestamptz default now()
);

create table analytics_sessions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  session_id text unique not null,
  contact_id uuid references contacts(id),
  source text,
  medium text,
  campaign text,
  landing_page text,
  referrer text,
  device_type text,
  browser text,
  country text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer,
  page_views integer default 0,
  events_count integer default 0
);

create table attribution_touchpoints (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  deal_id uuid references deals(id),
  touchpoint_type text,
  source text,
  medium text,
  campaign text,
  attribution_weight decimal(5,4),
  occurred_at timestamptz default now()
);

create index idx_email_lists_workspace on email_lists(workspace_id);
create index idx_subscribers_list on email_subscribers(list_id);
create index idx_subscribers_status on email_subscribers(status);
create index idx_sends_campaign on email_sends(campaign_id);
create index idx_sends_subscriber on email_sends(subscriber_id);
create index idx_events_workspace on analytics_events(workspace_id);
create index idx_events_type on analytics_events(event_type);
create index idx_events_created on analytics_events(created_at);
create index idx_sessions_workspace on analytics_sessions(workspace_id);
create index idx_sessions_contact on analytics_sessions(contact_id);
create index idx_touchpoints_contact on attribution_touchpoints(contact_id);
create index idx_touchpoints_deal on attribution_touchpoints(deal_id);
