import type {
  SocialAccount, SocialPost, SocialInboxMessage,
  HashtagResearch, HashtagSuggestion, CompetitorTracking,
} from '../types/social';

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

// Social Accounts
export const socialAccountsApi = {
  list: () => request<{ data: SocialAccount[] }>('/api/social/accounts'),
  connect: (data: Partial<SocialAccount>) =>
    request<SocialAccount>('/api/social/accounts', { method: 'POST', body: JSON.stringify(data) }),
  disconnect: (id: string) =>
    request<{ success: boolean }>(`/api/social/accounts/${id}`, { method: 'DELETE' }),
  refresh: (id: string) =>
    request<SocialAccount>(`/api/social/accounts/${id}/refresh`, { method: 'POST' }),
};

// Social Posts
export const socialPostsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: SocialPost[]; total: number }>(`/api/social/posts${qs}`);
  },
  get: (id: string) => request<SocialPost>(`/api/social/posts/${id}`),
  create: (data: Partial<SocialPost>) =>
    request<SocialPost>('/api/social/posts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SocialPost>) =>
    request<SocialPost>(`/api/social/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/social/posts/${id}`, { method: 'DELETE' }),
  publish: (id: string) =>
    request<SocialPost>(`/api/social/posts/${id}/publish`, { method: 'POST' }),
  bulkSchedule: (posts: Partial<SocialPost>[]) =>
    request<{ scheduled: number; posts: SocialPost[] }>('/api/social/posts/bulk-schedule', { method: 'POST', body: JSON.stringify({ posts }) }),
};

// Social Inbox
export const socialInboxApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: SocialInboxMessage[]; total: number }>(`/api/social/inbox${qs}`);
  },
  reply: (id: string, reply_text: string) =>
    request<SocialInboxMessage>(`/api/social/inbox/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply_text }) }),
  markReplied: (id: string) =>
    request<SocialInboxMessage>(`/api/social/inbox/${id}/mark-replied`, { method: 'PUT' }),
};

// Hashtags
export const hashtagsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: HashtagResearch[] }>(`/api/hashtags${qs}`);
  },
  research: (hashtag: string, platform?: string) =>
    request<HashtagResearch>('/api/hashtags/research', { method: 'POST', body: JSON.stringify({ hashtag, platform }) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/hashtags/${id}`, { method: 'DELETE' }),
  suggestions: (content: string) =>
    request<{ suggestions: HashtagSuggestion[] }>(`/api/hashtags/suggestions?content=${encodeURIComponent(content)}`),
};

// Competitors
export const competitorsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: CompetitorTracking[] }>(`/api/competitors${qs}`);
  },
  get: (id: string) => request<CompetitorTracking>(`/api/competitors/${id}`),
  create: (data: Partial<CompetitorTracking>) =>
    request<CompetitorTracking>('/api/competitors', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/competitors/${id}`, { method: 'DELETE' }),
  sync: (id: string) =>
    request<CompetitorTracking>(`/api/competitors/${id}/sync`, { method: 'POST' }),
};
