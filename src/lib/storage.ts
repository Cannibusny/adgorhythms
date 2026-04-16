import type {
  AgencySettings,
  Client,
  Campaign,
  Revenue,
  Call,
  Activity,
  Task,
} from '../types';

const KEYS = {
  agency: 'adgo_agency',
  clients: 'adgo_clients',
  campaigns: 'adgo_campaigns',
  revenue: 'adgo_revenue',
  calls: 'adgo_calls',
  activity: 'adgo_activity',
  tasks: 'adgo_tasks',
  initialized: 'adgo_initialized',
};

function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  isInitialized: (): boolean => !!localStorage.getItem(KEYS.initialized),
  markInitialized: (): void => localStorage.setItem(KEYS.initialized, 'true'),

  getAgency: (): AgencySettings | null => get<AgencySettings>(KEYS.agency),
  setAgency: (data: AgencySettings): void => set(KEYS.agency, data),

  getClients: (): Client[] => get<Client[]>(KEYS.clients) ?? [],
  setClients: (data: Client[]): void => set(KEYS.clients, data),
  addClient: (client: Client): void => {
    const clients = storage.getClients();
    set(KEYS.clients, [...clients, client]);
  },
  updateClient: (id: string, updates: Partial<Client>): void => {
    const clients = storage.getClients().map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    set(KEYS.clients, clients);
  },
  deleteClient: (id: string): void => {
    const clients = storage.getClients().filter((c) => c.id !== id);
    set(KEYS.clients, clients);
  },

  getCampaigns: (): Campaign[] => get<Campaign[]>(KEYS.campaigns) ?? [],
  setCampaigns: (data: Campaign[]): void => set(KEYS.campaigns, data),
  addCampaign: (campaign: Campaign): void => {
    const campaigns = storage.getCampaigns();
    set(KEYS.campaigns, [...campaigns, campaign]);
  },
  updateCampaign: (id: string, updates: Partial<Campaign>): void => {
    const campaigns = storage.getCampaigns().map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    set(KEYS.campaigns, campaigns);
  },

  getRevenue: (): Revenue[] => get<Revenue[]>(KEYS.revenue) ?? [],
  setRevenue: (data: Revenue[]): void => set(KEYS.revenue, data),
  addRevenue: (record: Revenue): void => {
    const revenue = storage.getRevenue();
    set(KEYS.revenue, [...revenue, record]);
  },
  updateRevenue: (id: string, updates: Partial<Revenue>): void => {
    const revenue = storage.getRevenue().map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    set(KEYS.revenue, revenue);
  },

  getCalls: (): Call[] => get<Call[]>(KEYS.calls) ?? [],
  setCalls: (data: Call[]): void => set(KEYS.calls, data),
  addCall: (call: Call): void => {
    const calls = storage.getCalls();
    set(KEYS.calls, [...calls, call]);
  },
  updateCall: (id: string, updates: Partial<Call>): void => {
    const calls = storage.getCalls().map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    set(KEYS.calls, calls);
  },

  getActivity: (): Activity[] => get<Activity[]>(KEYS.activity) ?? [],
  addActivity: (activity: Activity): void => {
    const activities = storage.getActivity();
    set(KEYS.activity, [activity, ...activities].slice(0, 100));
  },

  getTasks: (): Task[] => get<Task[]>(KEYS.tasks) ?? [],
  setTasks: (tasks: Task[]): void => set(KEYS.tasks, tasks),
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
