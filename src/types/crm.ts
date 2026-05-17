export type LifecycleStage = 'subscriber' | 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer' | 'evangelist';
export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'task';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
export type SequenceStatus = 'active' | 'paused' | 'archived';
export type EnrollmentStatus = 'active' | 'completed' | 'unsubscribed';
export type WorkflowTrigger = 'contact_created' | 'contact_updated' | 'deal_stage_changed' | 'email_opened' | 'email_clicked' | 'form_submitted';

export interface Contact {
  id: string;
  workspace_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  lead_source: string | null;
  lead_score: number;
  tags: string[];
  custom_fields: Record<string, unknown> | null;
  lifecycle_stage: LifecycleStage;
  created_at: string;
  updated_at: string;
  activities?: CRMActivity[];
  deals?: Deal[];
  enrollments?: SequenceEnrollment[];
}

export interface Deal {
  id: string;
  workspace_id: string;
  contact_id: string | null;
  name: string;
  amount: number | null;
  stage: DealStage;
  probability: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  assigned_to: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacts?: Pick<Contact, 'id' | 'email' | 'first_name' | 'last_name' | 'company' | 'phone'> | null;
  activities?: CRMActivity[];
}

export interface CRMActivity {
  id: string;
  workspace_id: string;
  contact_id: string;
  deal_id: string | null;
  activity_type: ActivityType;
  subject: string | null;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  contacts?: Pick<Contact, 'id' | 'email' | 'first_name' | 'last_name'> | null;
}

export interface EmailCampaign {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  html_content: string | null;
  plain_text_content: string | null;
  status: CampaignStatus;
  send_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
  open_rate?: number;
  click_rate?: number;
}

export interface EmailSequence {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: SequenceStatus;
  created_at: string;
  enrolled_count?: number;
  completed_count?: number;
  step_count?: number;
  completion_rate?: number;
  steps?: SequenceStep[];
  enrollments?: SequenceEnrollment[];
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  html_content: string | null;
  plain_text_content: string | null;
  created_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  current_step: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  contacts?: Pick<Contact, 'id' | 'email' | 'first_name' | 'last_name'> | null;
  email_sequences?: Pick<EmailSequence, 'name' | 'status'> | null;
}

export interface WorkflowCondition {
  entity: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface WorkflowAction {
  type: 'add_tag' | 'update_field' | 'enroll_in_sequence' | 'create_activity' | 'update_lifecycle';
  tag?: string;
  field?: string;
  value?: string;
  sequence_id?: string;
  activity_type?: ActivityType;
  subject?: string;
  description?: string;
  due_days?: number;
  lifecycle_stage?: LifecycleStage;
}

export interface Workflow {
  id: string;
  workspace_id: string;
  name: string;
  trigger_type: WorkflowTrigger;
  trigger_config: { conditions?: WorkflowCondition[] } | null;
  actions: WorkflowAction[] | null;
  status: 'active' | 'paused';
  created_at: string;
  execution_count?: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  contact_id: string | null;
  deal_id: string | null;
  status: 'running' | 'completed' | 'failed';
  result: Record<string, unknown> | null;
  executed_at: string;
  completed_at: string | null;
  contacts?: Pick<Contact, 'id' | 'email' | 'first_name' | 'last_name'> | null;
}

export interface DealForecast {
  totalPipeline: number;
  weightedPipeline: number;
  dealCount: number;
  byMonth: Array<{ month: string; total: number; weighted: number; count: number }>;
  byStage: Array<{ stage: string; total: number; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}
