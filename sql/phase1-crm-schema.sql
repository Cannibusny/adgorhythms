-- ADgorhythms Phase 1: Marketing Automation + CRM Schema
-- Run this migration against your Supabase/PostgreSQL database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Workspaces
create table if not exists workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text check (plan in ('starter', 'professional', 'enterprise')) default 'starter',
  contact_limit integer default 10000,
  user_limit integer default 1,
  created_at timestamptz default now()
);

-- Workspace Members
create table if not exists workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('admin', 'editor', 'viewer')) default 'editor',
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- Contacts
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  company text,
  job_title text,
  website text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  lead_source text,
  lead_score integer default 0,
  tags text[],
  custom_fields jsonb,
  lifecycle_stage text check (lifecycle_stage in ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist')) default 'lead',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, email)
);

-- Deals
create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  name text not null,
  amount decimal(12,2),
  stage text check (stage in ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) default 'prospecting',
  probability integer check (probability between 0 and 100),
  expected_close_date date,
  actual_close_date date,
  assigned_to uuid,
  tags text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activities
create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  activity_type text check (activity_type in ('email', 'call', 'meeting', 'note', 'task')) not null,
  subject text,
  description text,
  completed boolean default false,
  due_date timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz default now()
);

-- Email Campaigns
create table if not exists email_campaigns (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  subject text not null,
  from_name text not null,
  from_email text not null,
  reply_to text,
  html_content text,
  plain_text_content text,
  status text check (status in ('draft', 'scheduled', 'sending', 'sent', 'paused')) default 'draft',
  send_at timestamptz,
  sent_at timestamptz,
  recipient_count integer default 0,
  opened_count integer default 0,
  clicked_count integer default 0,
  created_at timestamptz default now()
);

-- Email Sequences
create table if not exists email_sequences (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text check (status in ('active', 'paused', 'archived')) default 'active',
  created_at timestamptz default now()
);

-- Sequence Steps
create table if not exists sequence_steps (
  id uuid primary key default uuid_generate_v4(),
  sequence_id uuid references email_sequences(id) on delete cascade,
  step_number integer not null,
  delay_days integer not null,
  subject text not null,
  html_content text,
  plain_text_content text,
  created_at timestamptz default now()
);

-- Sequence Enrollments
create table if not exists sequence_enrollments (
  id uuid primary key default uuid_generate_v4(),
  sequence_id uuid references email_sequences(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  current_step integer default 1,
  status text check (status in ('active', 'completed', 'unsubscribed')) default 'active',
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  last_email_sent_at timestamptz,
  unique(sequence_id, contact_id)
);

-- Workflows
create table if not exists workflows (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  trigger_type text check (trigger_type in ('contact_created', 'contact_updated', 'deal_stage_changed', 'email_opened', 'email_clicked', 'form_submitted')) not null,
  trigger_config jsonb,
  actions jsonb,
  status text check (status in ('active', 'paused')) default 'active',
  created_at timestamptz default now()
);

-- Workflow Executions
create table if not exists workflow_executions (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid references workflows(id) on delete cascade,
  contact_id uuid references contacts(id),
  deal_id uuid references deals(id),
  status text check (status in ('running', 'completed', 'failed')) default 'running',
  result jsonb,
  executed_at timestamptz default now(),
  completed_at timestamptz
);

-- Indexes
create index if not exists idx_contacts_workspace on contacts(workspace_id);
create index if not exists idx_contacts_email on contacts(email);
create index if not exists idx_contacts_lifecycle on contacts(lifecycle_stage);
create index if not exists idx_deals_workspace on deals(workspace_id);
create index if not exists idx_deals_contact on deals(contact_id);
create index if not exists idx_deals_stage on deals(stage);
create index if not exists idx_activities_contact on activities(contact_id);
create index if not exists idx_activities_deal on activities(deal_id);
create index if not exists idx_campaigns_workspace on email_campaigns(workspace_id);
create index if not exists idx_sequences_workspace on email_sequences(workspace_id);
create index if not exists idx_enrollments_contact on sequence_enrollments(contact_id);
create index if not exists idx_workflows_workspace on workflows(workspace_id);

-- Default workspace for development
insert into workspaces (id, name, plan, contact_limit, user_limit)
values ('00000000-0000-0000-0000-000000000001', 'ADgorhythms HQ', 'enterprise', 100000, 50)
on conflict (id) do nothing;
