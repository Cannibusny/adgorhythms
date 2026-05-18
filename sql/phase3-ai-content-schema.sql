-- Phase 3: AI Content Generator Schema
-- Run AFTER Phase 1 and Phase 2 migrations

create table content_generations (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  generation_type text check (generation_type in ('voice', 'text', 'url')) not null,
  input_source text,
  input_transcript text,
  business_context jsonb,
  generated_content jsonb,
  status text check (status in ('processing', 'completed', 'failed')) default 'processing',
  tokens_used integer,
  generation_time_seconds integer,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table content_library (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  generation_id uuid references content_generations(id),
  content_type text check (content_type in ('social_post', 'email', 'blog', 'landing_page', 'ad_copy', 'video_script')) not null,
  platform text,
  title text,
  content text not null,
  media_suggestions jsonb,
  hashtags text[],
  status text check (status in ('draft', 'approved', 'published', 'archived')) default 'draft',
  used_at timestamptz,
  created_at timestamptz default now()
);

create table ai_brand_voice (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  tone text check (tone in ('professional', 'casual', 'friendly', 'authoritative', 'playful', 'empathetic')) default 'professional',
  industry text,
  target_audience text,
  key_values text[],
  avoid_words text[],
  sample_content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table content_templates (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  template_name text not null,
  content_type text not null,
  template_structure jsonb,
  is_default boolean default false,
  created_at timestamptz default now()
);

create index idx_generations_workspace on content_generations(workspace_id);
create index idx_library_workspace on content_library(workspace_id);
create index idx_library_type on content_library(content_type);
create index idx_brand_voice_workspace on ai_brand_voice(workspace_id);
create index idx_templates_workspace on content_templates(workspace_id);
