export interface SeoKeyword {
  id: string;
  workspace_id: string;
  keyword: string;
  search_volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  current_rank: number | null;
  target_rank: number | null;
  tracked: boolean;
  last_updated: string;
}

export interface KeywordResearchResult {
  keyword: string;
  search_volume: number;
  difficulty: number;
  cpc: number;
  trend: string;
  related_keywords: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  volume: number;
  difficulty: number;
}

export interface SeoBacklink {
  id: string;
  workspace_id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  domain_authority: number | null;
  page_authority: number | null;
  discovered_at: string;
  status: 'active' | 'lost';
}

export interface SeoSiteAudit {
  id: string;
  workspace_id: string;
  url: string;
  audit_score: number;
  issues_critical: number;
  issues_warnings: number;
  issues_info: number;
  issues_details: {
    critical: AuditIssue[];
    warnings: AuditIssue[];
    info: AuditIssue[];
  };
  audited_at: string;
}

export interface AuditIssue {
  issue: string;
  page?: string;
  pages?: number;
  impact?: string;
}

export interface CalendarType {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  price_cents: number | null;
  active: boolean;
  created_at: string;
}

export interface CalendarAvailability {
  id: string;
  workspace_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
}

export interface CalendarBooking {
  id: string;
  workspace_id: string;
  calendar_type_id: string;
  contact_id: string | null;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  scheduled_for: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meeting_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface AvailableSlot {
  time: string;
  display: string;
}
