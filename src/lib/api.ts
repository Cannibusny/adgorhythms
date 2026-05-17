import type {
  Contact, Deal, CRMActivity, EmailCampaign, EmailSequence,
  SequenceStep, Workflow, WorkflowExecution, DealForecast, PaginatedResponse,
} from '../types/crm';

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

// Contacts
export const contactsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Contact>>(`/api/contacts${qs}`);
  },
  get: (id: string) => request<Contact>(`/api/contacts/${id}`),
  create: (data: Partial<Contact>) => request<Contact>('/api/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Contact>) => request<Contact>(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/contacts/${id}`, { method: 'DELETE' }),
  addTag: (id: string, tag: string) => request<Contact>(`/api/contacts/${id}/tag`, { method: 'POST', body: JSON.stringify({ tag }) }),
  removeTag: (id: string, tag: string) => request<Contact>(`/api/contacts/${id}/tag/${encodeURIComponent(tag)}`, { method: 'DELETE' }),
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/contacts/import`, { method: 'POST', body: formData });
    return res.json();
  },
  exportCsv: () => `${API_BASE}/api/contacts/export`,
};

// Deals
export const dealsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Deal>>(`/api/deals${qs}`);
  },
  get: (id: string) => request<Deal>(`/api/deals/${id}`),
  create: (data: Partial<Deal>) => request<Deal>('/api/deals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Deal>) => request<Deal>(`/api/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/deals/${id}`, { method: 'DELETE' }),
  updateStage: (id: string, stage: string) => request<Deal>(`/api/deals/${id}/stage`, { method: 'PUT', body: JSON.stringify({ stage }) }),
  forecast: () => request<DealForecast>('/api/deals/forecast'),
};

// Activities
export const activitiesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<CRMActivity>>(`/api/activities${qs}`);
  },
  create: (data: Partial<CRMActivity>) => request<CRMActivity>('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CRMActivity>) => request<CRMActivity>(`/api/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/activities/${id}`, { method: 'DELETE' }),
  complete: (id: string) => request<CRMActivity>(`/api/activities/${id}/complete`, { method: 'PUT' }),
};

// Email Campaigns
export const campaignsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<EmailCampaign>>(`/api/campaigns${qs}`);
  },
  get: (id: string) => request<EmailCampaign>(`/api/campaigns/${id}`),
  create: (data: Partial<EmailCampaign>) => request<EmailCampaign>('/api/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<EmailCampaign>) => request<EmailCampaign>(`/api/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  send: (id: string) => request<EmailCampaign>(`/api/campaigns/${id}/send`, { method: 'POST' }),
  schedule: (id: string, sendAt: string) => request<EmailCampaign>(`/api/campaigns/${id}/schedule`, { method: 'POST', body: JSON.stringify({ send_at: sendAt }) }),
  stats: (id: string) => request<Record<string, number>>(`/api/campaigns/${id}/stats`),
};

// Email Sequences
export const sequencesApi = {
  list: () => request<PaginatedResponse<EmailSequence>>('/api/sequences'),
  get: (id: string) => request<EmailSequence>(`/api/sequences/${id}`),
  create: (data: Partial<EmailSequence>) => request<EmailSequence>('/api/sequences', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<EmailSequence>) => request<EmailSequence>(`/api/sequences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/sequences/${id}`, { method: 'DELETE' }),
  addStep: (seqId: string, data: Partial<SequenceStep>) => request<SequenceStep>(`/api/sequences/${seqId}/steps`, { method: 'POST', body: JSON.stringify(data) }),
  updateStep: (seqId: string, stepId: string, data: Partial<SequenceStep>) => request<SequenceStep>(`/api/sequences/${seqId}/steps/${stepId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStep: (seqId: string, stepId: string) => request<{ success: boolean }>(`/api/sequences/${seqId}/steps/${stepId}`, { method: 'DELETE' }),
  enroll: (seqId: string, contactIds: string[]) => request<{ enrolled: number }>(`/api/sequences/${seqId}/enroll`, { method: 'POST', body: JSON.stringify({ contact_ids: contactIds }) }),
  unenroll: (seqId: string, contactIds: string[]) => request<{ unenrolled: number }>(`/api/sequences/${seqId}/unenroll`, { method: 'POST', body: JSON.stringify({ contact_ids: contactIds }) }),
};

// Workflows
export const workflowsApi = {
  list: () => request<PaginatedResponse<Workflow>>('/api/workflows'),
  get: (id: string) => request<Workflow>(`/api/workflows/${id}`),
  create: (data: Partial<Workflow>) => request<Workflow>('/api/workflows', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Workflow>) => request<Workflow>(`/api/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ success: boolean }>(`/api/workflows/${id}`, { method: 'DELETE' }),
  toggle: (id: string) => request<Workflow>(`/api/workflows/${id}/toggle`, { method: 'PUT' }),
  executions: (id: string) => request<PaginatedResponse<WorkflowExecution>>(`/api/workflows/${id}/executions`),
};
