export type ClientStage =
  | 'prospects'
  | 'outreach_sent'
  | 'discovery_call'
  | 'proposal_sent'
  | 'active_client'
  | 'completed';

export type PackageTier = 'starter' | 'growth' | 'scale' | 'enterprise' | 'retainer';

export type BusinessType =
  | 'Restaurant'
  | 'Retail'
  | 'Contractor'
  | 'Home Services'
  | 'Cannabis'
  | 'Professional Services'
  | 'Trading Card Business'
  | 'Coffee Brand'
  | 'Other';

export type LeadSource =
  | 'Walk-in'
  | 'Referral'
  | 'Social Media'
  | 'Cold outreach'
  | 'Card show'
  | 'Other';

export type CallOutcome = 'Interested' | 'Not now' | 'Closed' | 'No show';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export type CampaignHealth = 'On Track' | 'Needs Attention' | 'At Risk';

export type DeliverableStatus = 'pending' | 'complete' | 'overdue';

export interface Client {
  id: string;
  businessName: string;
  businessType: BusinessType;
  ownerName: string;
  phone: string;
  email: string;
  website: string;
  source: LeadSource;
  budget: number;
  painPoints: string;
  stage: ClientStage;
  packageTier: PackageTier | null;
  monthlyValue: number;
  startDate: string;
  status: 'active' | 'paused' | 'cancelled';
  notes: string;
  callHistory: Call[];
  proposals: Proposal[];
  createdAt: string;
}

export interface Proposal {
  id: string;
  clientId: string;
  packageTier: PackageTier;
  content: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
  sentAt?: string;
}

export interface Deliverable {
  id: string;
  description: string;
  dueDate: string;
  status: DeliverableStatus;
  notes: string;
  week: number;
}

export interface CampaignNote {
  id: string;
  content: string;
  timestamp: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate: string;
  packageTier: PackageTier;
  health: CampaignHealth;
  completion: number;
  deliverables: Deliverable[];
  notes: CampaignNote[];
  metrics: {
    postsPublished: number;
    estimatedReach: number;
    engagementRate: number;
    leadsGenerated: number;
    satisfaction: number;
  };
}

export interface Revenue {
  id: string;
  clientId: string;
  amount: number;
  month: string;
  status: PaymentStatus;
  paidDate?: string;
}

export interface Call {
  id: string;
  clientId: string;
  businessName: string;
  ownerName: string;
  scheduledDate: string;
  outcome?: CallOutcome;
  packageDiscussed?: PackageTier;
  objections?: string;
  nextStep?: string;
  followUpDate?: string;
  notes?: string;
  prepBrief?: string;
}

export interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface AgencySettings {
  name: string;
  owner: string;
  location: string;
  calendlyLink: string;
  email: string;
  phone: string;
  website: string;
  apiKey: string;
  monthlyGoal: number;
  dailyOutreachGoal: number;
  weeklyCallGoal: number;
}

export interface PackageConfig {
  id: PackageTier;
  name: string;
  price: number;
  period: 'one-time' | 'month';
  includes: string[];
  bestFor: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}
