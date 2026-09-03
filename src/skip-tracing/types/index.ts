// Skip Tracing Business Type System

export type BusinessEntity = 'TracerIO' | 'SurplusTrustGroup' | 'BountyFundFinder';

export type CaseStatus =
  | 'new'
  | 'intake'
  | 'research'
  | 'located'
  | 'verified'
  | 'outreach'
  | 'recovery'
  | 'closed'
  | 'dead_end'
  | 'unverified'
  | 'declined'
  | 'pending'
  | 'disputed';

export type CasePriority = 'critical' | 'high' | 'medium' | 'low';

export type PermissiblePurpose =
  | 'debt_collection'
  | 'legal_process'
  | 'insurance_claim'
  | 'asset_recovery'
  | 'surplus_recovery'
  | 'bounty_recovery'
  | 'compliance'
  | 'litigation'
  | 'estate_settlement';

export type RevenueModel = 'per_trace' | 'bulk_contract' | 'subscription' | 'contingency' | 'bounty_split' | 'flat_fee';

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'escalated';

export type AgentRole =
  | 'intake'
  | 'research'
  | 'verification'
  | 'outreach'
  | 'recovery'
  | 'billing'
  | 'compliance';

// --- Core Entities ---

export interface SkipTraceCase {
  id: string;
  entity: BusinessEntity;
  status: CaseStatus;
  priority: CasePriority;
  clientId: string;
  subjectId: string;
  permissiblePurpose: PermissiblePurpose;
  revenueModel: RevenueModel;
  estimatedValue: number;
  assignedAgent: AgentRole;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  notes: string;
  tags: string[];
}

export interface Subject {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  aliases: string[];
  dateOfBirth?: string;
  ssn_last4?: string;
  knownAddresses: Address[];
  knownPhones: PhoneRecord[];
  knownEmails: string[];
  employmentHistory: EmploymentRecord[];
  associatedEntities: string[];
  locatedAddress?: Address;
  locatedPhone?: string;
  locatedEmail?: string;
  verificationScore: number;
  lastVerifiedAt?: string;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  type: 'current' | 'previous' | 'mailing' | 'located';
  source: string;
  verifiedAt?: string;
  confidence: number;
}

export interface PhoneRecord {
  number: string;
  type: 'mobile' | 'landline' | 'voip' | 'unknown';
  carrier?: string;
  status: 'active' | 'disconnected' | 'unknown';
  source: string;
  verifiedAt?: string;
}

export interface EmploymentRecord {
  employer: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  address?: Address;
  source: string;
}

export interface SkipTraceClient {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: Address;
  clientType: 'law_firm' | 'collection_agency' | 'insurance' | 'government' | 'individual' | 'corporate';
  contractType: RevenueModel;
  contractRate: number;
  activeCases: number;
  totalCases: number;
  totalRevenue: number;
  status: 'active' | 'inactive' | 'suspended';
  onboardedAt: string;
  complianceCertified: boolean;
}

// --- Surplus Trust Group Specific ---

export interface SurplusFund {
  id: string;
  caseId: string;
  source: 'tax_sale' | 'foreclosure' | 'estate' | 'government' | 'insurance' | 'other';
  jurisdiction: string;
  county: string;
  state: string;
  parcelId?: string;
  originalOwner: string;
  surplusAmount: number;
  claimDeadline?: string;
  filingStatus: 'identified' | 'researched' | 'claim_filed' | 'claim_approved' | 'funds_received' | 'distributed' | 'denied';
  contingencyRate: number;
  estimatedFee: number;
  actualFee?: number;
  documentIds: string[];
}

// --- Bounty Fund Finder Specific ---

export interface BountyCase {
  id: string;
  caseId: string;
  bountyType: 'fugitive' | 'missing_person' | 'asset_recovery' | 'unclaimed_reward' | 'finder_fee';
  bountySource: string;
  bountyAmount: number;
  splitPercentage: number;
  estimatedPayout: number;
  deadline?: string;
  status: 'active' | 'located' | 'claimed' | 'paid' | 'expired' | 'cancelled';
  legalRequirements: string[];
}

// --- Workflow & Compliance ---

export interface ApprovalGate {
  id: string;
  caseId: string;
  action: string;
  description: string;
  requestedBy: AgentRole;
  status: ApprovalStatus;
  threshold: string;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface AuditEntry {
  id: string;
  caseId: string;
  agentRole: AgentRole;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  dataAccessed?: string[];
  complianceFlags?: string[];
}

export interface ComplianceCheck {
  id: string;
  caseId: string;
  checkType: 'fcra' | 'fdcpa' | 'glba' | 'tcpa' | 'canspam' | 'state_specific';
  regulation: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  details: string;
  checkedAt: string;
  nextCheckDue?: string;
}

export interface Document {
  id: string;
  caseId: string;
  type: 'demand_letter' | 'claim_filing' | 'verification_notice' | 'settlement_agreement' | 'invoice' | 'report' | 'correspondence';
  title: string;
  content: string;
  generatedAt: string;
  sentAt?: string;
  status: 'draft' | 'approved' | 'sent' | 'acknowledged';
}

// --- Billing ---

export interface Invoice {
  id: string;
  clientId: string;
  caseIds: string[];
  entity: BusinessEntity;
  amount: number;
  type: RevenueModel;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  caseId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// --- Dashboard & Reporting ---

export interface EntityMetrics {
  entity: BusinessEntity;
  activeCases: number;
  closedCasesThisMonth: number;
  hitRate: number;
  revenueThisMonth: number;
  revenueMTD: number;
  pendingApprovals: number;
  complianceScore: number;
  avgCaseAge: number;
}

export interface ExecutiveSummary {
  date: string;
  totalActiveCases: number;
  totalRevenueMTD: number;
  totalRevenueYTD: number;
  pendingApprovals: ApprovalGate[];
  complianceAlerts: ComplianceCheck[];
  entityBreakdown: EntityMetrics[];
  recentActivity: AuditEntry[];
  upcomingDeadlines: { caseId: string; deadline: string; description: string }[];
}
