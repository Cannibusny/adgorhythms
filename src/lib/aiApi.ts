import type {
  ContentGeneration, ContentLibraryItem, BrandVoice,
  ContentTemplate, BrandVoiceAnalysis,
} from '../types/ai';

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

// AI Generation
export const aiGenerateApi = {
  generate: (data: {
    generation_type: string;
    input: string;
    content_types?: string[];
    quantity?: Record<string, number>;
  }) =>
    request<{ generation: ContentGeneration; items_created: number }>('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateSingle: (data: { content_type: string; platform?: string; topic: string }) =>
    request<ContentLibraryItem>('/api/ai/generate-single', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getGeneration: (id: string) =>
    request<{ generation: ContentGeneration; items: ContentLibraryItem[] }>(`/api/ai/generations/${id}`),
  listGenerations: () =>
    request<{ data: ContentGeneration[] }>('/api/ai/generations'),
};

// Content Library
export const contentLibraryApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: ContentLibraryItem[]; total: number }>(`/api/content/library${qs}`);
  },
  get: (id: string) => request<ContentLibraryItem>(`/api/content/library/${id}`),
  update: (id: string, data: Partial<ContentLibraryItem>) =>
    request<ContentLibraryItem>(`/api/content/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/content/library/${id}`, { method: 'DELETE' }),
  approve: (id: string) =>
    request<ContentLibraryItem>(`/api/content/library/${id}/approve`, { method: 'POST' }),
  publish: (id: string) =>
    request<ContentLibraryItem>(`/api/content/library/${id}/publish`, { method: 'POST' }),
  schedule: (id: string, scheduled_for: string) =>
    request<ContentLibraryItem>(`/api/content/library/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduled_for }),
    }),
  bulkApprove: (ids: string[]) =>
    request<{ updated: number }>('/api/content/library/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  bulkArchive: (ids: string[]) =>
    request<{ updated: number }>('/api/content/library/bulk-archive', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  bulkDelete: (ids: string[]) =>
    request<{ deleted: number }>('/api/content/library/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

// Brand Voice
export const brandVoiceApi = {
  get: () => request<BrandVoice | null>('/api/brand-voice'),
  update: (data: Partial<BrandVoice>) =>
    request<BrandVoice>('/api/brand-voice', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  analyze: (sample_content: string) =>
    request<BrandVoiceAnalysis>('/api/brand-voice/analyze', {
      method: 'POST',
      body: JSON.stringify({ sample_content }),
    }),
};

// Content Templates
export const contentTemplatesApi = {
  list: () => request<{ data: ContentTemplate[] }>('/api/templates'),
  create: (data: Partial<ContentTemplate>) =>
    request<ContentTemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ContentTemplate>) =>
    request<ContentTemplate>(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/templates/${id}`, { method: 'DELETE' }),
};
