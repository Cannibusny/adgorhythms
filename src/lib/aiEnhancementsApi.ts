const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS = '00000000-0000-0000-0000-000000000001';
const headers = { 'Content-Type': 'application/json', 'x-workspace-id': WS };

// Schema Markup
export const schemaMarkupApi = {
  generate: async (schema_type: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API}/seo/schema/generate`, { method: 'POST', headers, body: JSON.stringify({ schema_type, data }) });
    return res.json();
  },
  autoFill: async (url: string, schema_type?: string) => {
    const res = await fetch(`${API}/seo/schema/auto-fill`, { method: 'POST', headers, body: JSON.stringify({ url, schema_type }) });
    return res.json();
  },
  validate: async (schema: Record<string, unknown>) => {
    const res = await fetch(`${API}/seo/schema/validate`, { method: 'POST', headers, body: JSON.stringify({ schema }) });
    return res.json();
  },
  saveToLibrary: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API}/seo/schema/library`, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  listLibrary: async () => {
    const res = await fetch(`${API}/seo/schema/library`, { headers });
    return res.json();
  },
  deleteFromLibrary: async (id: string) => {
    const res = await fetch(`${API}/seo/schema/library/${id}`, { method: 'DELETE', headers });
    return res.json();
  },
  getTypes: async () => {
    const res = await fetch(`${API}/seo/schema/types`, { headers });
    return res.json();
  },
};

// AI Lead Scorer
export const aiLeadScorerApi = {
  scoreLead: async (contactId: string) => {
    const res = await fetch(`${API}/ai/leads/score-lead/${contactId}`, { method: 'POST', headers });
    return res.json();
  },
  getInsights: async (contactId: string) => {
    const res = await fetch(`${API}/ai/leads/lead-insights/${contactId}`, { headers });
    return res.json();
  },
  highValueLeads: async () => {
    const res = await fetch(`${API}/ai/leads/high-value-leads`, { headers });
    return res.json();
  },
};

// Customer Journey Mapper
export const aiJourneyApi = {
  mapJourney: async (contactId: string) => {
    const res = await fetch(`${API}/ai/journeys/map-journey/${contactId}`, { method: 'POST', headers });
    return res.json();
  },
  getJourney: async (contactId: string) => {
    const res = await fetch(`${API}/ai/journeys/journeys/${contactId}`, { headers });
    return res.json();
  },
  dropOffAnalysis: async () => {
    const res = await fetch(`${API}/ai/journeys/drop-off-analysis`, { headers });
    return res.json();
  },
};

// Competitor Intel
export const aiCompetitorIntelApi = {
  monitor: async (competitor_name: string) => {
    const res = await fetch(`${API}/ai/competitors-intel/monitor`, { method: 'POST', headers, body: JSON.stringify({ competitor_name }) });
    return res.json();
  },
  getUpdates: async (competitor_name?: string) => {
    const params = competitor_name ? `?competitor_name=${encodeURIComponent(competitor_name)}` : '';
    const res = await fetch(`${API}/ai/competitors-intel/updates${params}`, { headers });
    return res.json();
  },
  analyze: async (competitor_name: string) => {
    const res = await fetch(`${API}/ai/competitors-intel/analyze`, { method: 'POST', headers, body: JSON.stringify({ competitor_name }) });
    return res.json();
  },
};

// Ad Optimizer
export const aiAdOptimizerApi = {
  createExperiment: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API}/ai/ads/create-experiment`, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  listExperiments: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const res = await fetch(`${API}/ai/ads/experiments${params}`, { headers });
    return res.json();
  },
  reallocateBudget: async (id: string) => {
    const res = await fetch(`${API}/ai/ads/experiments/${id}/allocate`, { method: 'PUT', headers });
    return res.json();
  },
  getRecommendations: async () => {
    const res = await fetch(`${API}/ai/ads/recommendations`, { headers });
    return res.json();
  },
};

// Sales Call Analyzer
export const aiCallAnalyzerApi = {
  analyze: async (call_transcript: string, deal_id?: string) => {
    const res = await fetch(`${API}/ai/calls/analyze`, { method: 'POST', headers, body: JSON.stringify({ call_transcript, deal_id }) });
    return res.json();
  },
  getAnalysis: async (id: string) => {
    const res = await fetch(`${API}/ai/calls/${id}`, { headers });
    return res.json();
  },
  topPerformers: async () => {
    const res = await fetch(`${API}/ai/calls`, { headers });
    return res.json();
  },
};

// Churn Predictor
export const aiChurnPredictorApi = {
  predict: async () => {
    const res = await fetch(`${API}/ai/churn/predict`, { method: 'POST', headers });
    return res.json();
  },
  atRisk: async () => {
    const res = await fetch(`${API}/ai/churn/at-risk`, { headers });
    return res.json();
  },
  winBack: async (contactId: string) => {
    const res = await fetch(`${API}/ai/churn/win-back/${contactId}`, { method: 'POST', headers });
    return res.json();
  },
};

// ROI Calculator
export const aiRoiApi = {
  calculate: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API}/ai/roi/calculate`, { method: 'POST', headers, body: JSON.stringify(data) });
    return res.json();
  },
  byChannel: async () => {
    const res = await fetch(`${API}/ai/roi/by-channel`, { headers });
    return res.json();
  },
  trends: async () => {
    const res = await fetch(`${API}/ai/roi/trends`, { headers });
    return res.json();
  },
};
