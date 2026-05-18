-- ADgorhythms Phase 2: Social Media Management Schema
-- Run after phase1-crm-schema.sql

create table social_accounts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  platform text check (platform in ('instagram', 'facebook', 'linkedin', 'twitter', 'tiktok')) not null,
  account_name text not null,
  account_handle text,
  profile_image_url text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  is_connected boolean default true,
  created_at timestamptz default now(),
  unique(workspace_id, platform, account_handle)
);

create table social_posts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  account_id uuid references social_accounts(id) on delete cascade,
  content text not null,
  media_urls text[],
  scheduled_for timestamptz,
  status text check (status in ('draft', 'scheduled', 'published', 'failed')) default 'draft',
  platform_post_id text,
  published_at timestamptz,
  likes_count integer default 0,
  comments_count integer default 0,
  shares_count integer default 0,
  reach integer default 0,
  created_at timestamptz default now()
);

create table social_inbox (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  account_id uuid references social_accounts(id) on delete cascade,
  message_type text check (message_type in ('comment', 'dm', 'mention')) not null,
  from_user text not null,
  from_user_handle text,
  message_text text,
  platform_message_id text unique,
  replied boolean default false,
  reply_text text,
  replied_at timestamptz,
  created_at timestamptz default now()
);

create table hashtag_research (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  hashtag text not null,
  platform text,
  post_count bigint,
  engagement_rate decimal(5,2),
  difficulty_score integer check (difficulty_score between 1 and 10),
  last_updated timestamptz default now()
);

create table competitor_tracking (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  competitor_name text not null,
  platform text,
  account_handle text,
  follower_count integer,
  avg_engagement_rate decimal(5,2),
  last_synced_at timestamptz default now()
);

create index idx_social_accounts_workspace on social_accounts(workspace_id);
create index idx_social_posts_workspace on social_posts(workspace_id);
create index idx_social_posts_scheduled on social_posts(scheduled_for);
create index idx_social_inbox_workspace on social_inbox(workspace_id);
create index idx_social_inbox_replied on social_inbox(replied);
create index idx_hashtags_workspace on hashtag_research(workspace_id);
create index idx_competitors_workspace on competitor_tracking(workspace_id);
