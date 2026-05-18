const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS = '00000000-0000-0000-0000-000000000001';
const headers = { 'Content-Type': 'application/json', 'x-workspace-id': WS };

// SEO Keywords
export const seoKeywordsApi = {
  research: async (keyword: string) => {
    const res = await fetch(`${API}/seo/keywords/research`, { method: 'POST', headers, body: JSON.stringify({ keyword }) });
    return res.json();
  },
  list: async (tracked?: boolean) => {
    const params = tracked !== undefined ? `?tracked=${tracked}` : '';
    const res = await fetch(`${API}/seo/keywords${params}`, { headers });
    return res.json();
  },
  create: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API}/seo/keywords`, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API}/seo/keywords/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`${API}/seo/keywords/${id}`, { method: 'DELETE', headers });
    return res.json();
  },
  suggestions: async (seed: string) => {
    const res = await fetch(`${API}/seo/keywords/suggestions?seed=${encodeURIComponent(seed)}`, { headers });
    return res.json();
  },
};

// SEO Backlinks
export const seoBacklinksApi = {
  discover: async (domain: string) => {
    const res = await fetch(`${API}/seo/backlinks/discover`, { method: 'POST', headers, body: JSON.stringify({ domain }) });
    return res.json();
  },
  list: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const res = await fetch(`${API}/seo/backlinks${params}`, { headers });
    return res.json();
  },
  lost: async () => {
    const res = await fetch(`${API}/seo/backlinks/lost`, { headers });
    return res.json();
  },
  recent: async () => {
    const res = await fetch(`${API}/seo/backlinks/new`, { headers });
    return res.json();
  },
};

// SEO Audit
export const seoAuditApi = {
  run: async (url: string) => {
    const res = await fetch(`${API}/seo/audits`, { method: 'POST', headers, body: JSON.stringify({ url }) });
    return res.json();
  },
  list: async () => {
    const res = await fetch(`${API}/seo/audits`, { headers });
    return res.json();
  },
  get: async (id: string) => {
    const res = await fetch(`${API}/seo/audits/${id}`, { headers });
    return res.json();
  },
};

// Calendar Types
export const calendarTypesApi = {
  list: async () => {
    const res = await fetch(`${API}/calendar/types`, { headers });
    return res.json();
  },
  create: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API}/calendar/types`, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API}/calendar/types/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`${API}/calendar/types/${id}`, { method: 'DELETE', headers });
    return res.json();
  },
};

// Calendar Availability
export const calendarAvailabilityApi = {
  list: async () => {
    const res = await fetch(`${API}/calendar/availability`, { headers });
    return res.json();
  },
  create: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API}/calendar/availability`, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API}/calendar/availability/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`${API}/calendar/availability/${id}`, { method: 'DELETE', headers });
    return res.json();
  },
};

// Calendar Bookings
export const calendarBookingsApi = {
  list: async (params?: { status?: string; date_from?: string; date_to?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.date_from) sp.set('date_from', params.date_from);
    if (params?.date_to) sp.set('date_to', params.date_to);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    const res = await fetch(`${API}/calendar/bookings${qs}`, { headers });
    return res.json();
  },
  create: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API}/calendar/bookings`, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API}/calendar/bookings/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    return res.json();
  },
  cancel: async (id: string) => {
    const res = await fetch(`${API}/calendar/bookings/${id}`, { method: 'DELETE', headers });
    return res.json();
  },
  reschedule: async (id: string, scheduled_for: string) => {
    const res = await fetch(`${API}/calendar/bookings/${id}/reschedule`, { method: 'POST', headers, body: JSON.stringify({ scheduled_for }) });
    return res.json();
  },
  availableSlots: async (calendar_type_id: string, date: string) => {
    const res = await fetch(`${API}/calendar/bookings/available-slots?calendar_type_id=${calendar_type_id}&date=${date}`, { headers });
    return res.json();
  },
};
