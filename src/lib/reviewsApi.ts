const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const headers = { 'Content-Type': 'application/json' };

export const reviewMonitorApi = {
  add: (platform: string, business_url: string) =>
    fetch(`${API}/reviews/monitor`, { method: 'POST', headers, body: JSON.stringify({ platform, business_url }) }).then((r) => r.json()),
  list: () => fetch(`${API}/reviews/monitor`, { headers }).then((r) => r.json()),
  remove: (id: string) => fetch(`${API}/reviews/monitor/${id}`, { method: 'DELETE', headers }).then((r) => r.json()),
  sync: () => fetch(`${API}/reviews/sync`, { method: 'POST', headers }).then((r) => r.json()),
};

export const reviewsApi = {
  list: (filters?: { platform?: string; rating?: string; responded?: string; sentiment?: string }) => {
    const params = new URLSearchParams();
    if (filters?.platform) params.set('platform', filters.platform);
    if (filters?.rating) params.set('rating', filters.rating);
    if (filters?.responded) params.set('responded', filters.responded);
    if (filters?.sentiment) params.set('sentiment', filters.sentiment);
    return fetch(`${API}/reviews?${params}`, { headers }).then((r) => r.json());
  },
  generateResponse: (id: string) =>
    fetch(`${API}/reviews/${id}/generate-response`, { method: 'POST', headers }).then((r) => r.json()),
  postResponse: (id: string, response_text: string) =>
    fetch(`${API}/reviews/${id}/post-response`, { method: 'POST', headers, body: JSON.stringify({ response_text }) }).then((r) => r.json()),
  recover: (id: string, customer_email: string, offer_text?: string) =>
    fetch(`${API}/reviews/${id}/recover`, { method: 'POST', headers, body: JSON.stringify({ customer_email, offer_text }) }).then((r) => r.json()),
  recoveryStats: () => fetch(`${API}/reviews/recovery-stats`, { headers }).then((r) => r.json()),
  requestReview: (customer_email: string, customer_name?: string) =>
    fetch(`${API}/reviews/request`, { method: 'POST', headers, body: JSON.stringify({ customer_email, customer_name }) }).then((r) => r.json()),
  requestStats: () => fetch(`${API}/reviews/request-stats`, { headers }).then((r) => r.json()),
  stats: () => fetch(`${API}/reviews/stats`, { headers }).then((r) => r.json()),
  trends: () => fetch(`${API}/reviews/trends`, { headers }).then((r) => r.json()),
  competitors: () => fetch(`${API}/reviews/competitors`, { headers }).then((r) => r.json()),
};
