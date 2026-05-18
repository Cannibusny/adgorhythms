-- Phase 5: SEO Tools + Appointment Scheduling Schema
-- Run AFTER Phase 1, 2, 3, and 4 migrations

create table seo_keywords (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  keyword text not null,
  search_volume integer,
  difficulty integer check (difficulty between 1 and 100),
  cpc decimal(10,2),
  current_rank integer,
  target_rank integer,
  tracked boolean default false,
  last_updated timestamptz default now()
);

create table seo_backlinks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  source_url text not null,
  target_url text not null,
  anchor_text text,
  domain_authority integer,
  page_authority integer,
  discovered_at timestamptz default now(),
  status text check (status in ('active', 'lost')) default 'active'
);

create table seo_site_audits (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  url text not null,
  audit_score integer check (audit_score between 0 and 100),
  issues_critical integer default 0,
  issues_warnings integer default 0,
  issues_info integer default 0,
  issues_details jsonb,
  audited_at timestamptz default now()
);

create table calendar_types (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null,
  buffer_before_minutes integer default 0,
  buffer_after_minutes integer default 0,
  price_cents integer,
  active boolean default true,
  created_at timestamptz default now()
);

create table calendar_availability (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text default 'UTC'
);

create table calendar_bookings (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  calendar_type_id uuid references calendar_types(id) on delete cascade,
  contact_id uuid references contacts(id),
  attendee_name text not null,
  attendee_email text not null,
  attendee_phone text,
  scheduled_for timestamptz not null,
  duration_minutes integer not null,
  status text check (status in ('scheduled', 'completed', 'cancelled', 'no_show')) default 'scheduled',
  meeting_url text,
  notes text,
  created_at timestamptz default now()
);

create index idx_keywords_workspace on seo_keywords(workspace_id);
create index idx_keywords_tracked on seo_keywords(tracked) where tracked = true;
create index idx_backlinks_workspace on seo_backlinks(workspace_id);
create index idx_audits_workspace on seo_site_audits(workspace_id);
create index idx_calendar_types_workspace on calendar_types(workspace_id);
create index idx_availability_workspace on calendar_availability(workspace_id);
create index idx_bookings_workspace on calendar_bookings(workspace_id);
create index idx_bookings_scheduled on calendar_bookings(scheduled_for);
