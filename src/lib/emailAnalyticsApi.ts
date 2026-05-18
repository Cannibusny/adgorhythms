import type {
  EmailList, EmailSubscriber, EmailTemplate,
  CampaignAnalytics, AnalyticsEvent, AnalyticsSession,
  AttributionTouchpoint, AnalyticsOverview, TrafficData,
  ConversionData, RevenueData, FunnelStep, TrafficSource, ROIChannel,
} from '../types/emailAnalytics';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Email Lists
export const emailListsApi = {
  list: () => request<{ data: EmailList[] }>('/api/email/lists'),
  get: (id: string) => request<EmailList>(`/api/email/lists/${id}`),
  create: (data: Partial<EmailList>) =>
    request<EmailList>('/api/email/lists', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<EmailList>) =>
    request<EmailList>(`/api/email/lists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/email/lists/${id}`, { method: 'DELETE' }),
  import: (id: string, emails: string[]) =>
    request<{ imported: number }>(`/api/email/lists/${id}/import`, { method: 'POST', body: JSON.stringify({ emails }) }),
};

// Email Subscribers
export const emailSubscribersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: EmailSubscriber[]; total: number }>(`/api/email/subscribers${qs}`);
  },
  create: (data: Partial<EmailSubscriber>) =>
    request<EmailSubscriber>('/api/email/subscribers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<EmailSubscriber>) =>
    request<EmailSubscriber>(`/api/email/subscribers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/email/subscribers/${id}`, { method: 'DELETE' }),
  unsubscribe: (id: string) =>
    request<EmailSubscriber>(`/api/email/subscribers/${id}/unsubscribe`, { method: 'POST' }),
  bulkAdd: (list_id: string, subscribers: { email: string; contact_id?: string }[]) =>
    request<{ added: number }>('/api/email/subscribers/bulk-add', { method: 'POST', body: JSON.stringify({ list_id, subscribers }) }),
};

// Email Templates
export const emailTemplatesApi = {
  list: () => request<{ data: EmailTemplate[] }>('/api/email/templates'),
  create: (data: Partial<EmailTemplate>) =>
    request<EmailTemplate>('/api/email/templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<EmailTemplate>) =>
    request<EmailTemplate>(`/api/email/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/email/templates/${id}`, { method: 'DELETE' }),
};

// Email Tracking
export const emailTrackingApi = {
  getCampaignSends: (campaignId: string) =>
    request<{ data: unknown[]; total: number }>(`/api/email/campaigns/${campaignId}/sends`),
  getCampaignAnalytics: (campaignId: string) =>
    request<CampaignAnalytics>(`/api/email/campaigns/${campaignId}/analytics`),
  trackOpen: (send_id: string) =>
    request<{ success: boolean }>('/api/email/track/open', { method: 'POST', body: JSON.stringify({ send_id }) }),
  trackClick: (send_id: string) =>
    request<{ success: boolean }>('/api/email/track/click', { method: 'POST', body: JSON.stringify({ send_id }) }),
};

// Analytics
export const analyticsApi = {
  trackEvent: (data: Partial<AnalyticsEvent>) =>
    request<AnalyticsEvent>('/api/analytics/track', { method: 'POST', body: JSON.stringify(data) }),
  getEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: AnalyticsEvent[]; total: number }>(`/api/analytics/events${qs}`);
  },
  getFunnel: () => request<{ funnel: FunnelStep[] }>('/api/analytics/funnel'),
  getSessions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: AnalyticsSession[]; total: number }>(`/api/analytics/sessions${qs}`);
  },
  getSession: (id: string) =>
    request<{ session: AnalyticsSession; events: AnalyticsEvent[] }>(`/api/analytics/sessions/${id}`),
  getSources: () => request<{ data: TrafficSource[] }>('/api/analytics/sources'),
  getAttribution: (dealId: string) =>
    request<{ data: AttributionTouchpoint[] }>(`/api/analytics/attribution/${dealId}`),
  calculateAttribution: () =>
    request<{ calculated: number; deals: number }>('/api/analytics/attribution/calculate', { method: 'POST' }),
  getROI: () => request<{ data: ROIChannel[] }>('/api/analytics/roi'),
  getOverview: () => request<AnalyticsOverview>('/api/analytics/overview'),
  getTraffic: () => request<TrafficData>('/api/analytics/traffic'),
  getConversions: () => request<ConversionData>('/api/analytics/conversions'),
  getRevenue: () => request<RevenueData>('/api/analytics/revenue'),
};
