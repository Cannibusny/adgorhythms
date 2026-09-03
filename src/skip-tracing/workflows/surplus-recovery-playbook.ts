// Surplus Trust Group — Operational Playbook
// Step-by-step workflow for surplus fund recovery

export interface PlaybookStep {
  step: number;
  phase: string;
  action: string;
  who: 'system' | 'executive';
  details: string;
  tools: string[];
  estimatedTime: string;
  approvalRequired: boolean;
}

export const SURPLUS_RECOVERY_PLAYBOOK: PlaybookStep[] = [
  {
    step: 1,
    phase: 'PROSPECT',
    action: 'Obtain county surplus lists',
    who: 'system',
    details: 'Contact county treasurer/comptroller offices by phone or FOIL request to obtain lists of surplus funds from tax foreclosure auctions. Ulster and Sullivan Counties have forms online. Dutchess, Orange, Columbia, Greene need direct contact.',
    tools: ['Phone', 'Email', 'County websites', 'FOIL request'],
    estimatedTime: '1-3 days per county',
    approvalRequired: false,
  },
  {
    step: 2,
    phase: 'PROSPECT',
    action: 'Identify high-value surplus cases',
    who: 'system',
    details: 'Sort surplus lists by amount. Focus on cases with surplus > $2,000 (your 15% fee = $300+). Prioritize cases within the 3-year claim window. Flag any approaching deadlines.',
    tools: ['Spreadsheet', 'Case tracker'],
    estimatedTime: '1-2 hours per county list',
    approvalRequired: false,
  },
  {
    step: 3,
    phase: 'RESEARCH',
    action: 'Skip trace the former property owners',
    who: 'system',
    details: 'Use the parcel ID and former owner name from the surplus list to locate current contact information. Start with free tools (voter records, social media, whitepages, property records). Escalate to paid databases (TLOxp, IRB Search) for harder-to-find subjects.',
    tools: ['Public records', 'Social media', 'Voter rolls', 'TLOxp', 'IRB Search'],
    estimatedTime: '15-60 minutes per subject',
    approvalRequired: false,
  },
  {
    step: 4,
    phase: 'OUTREACH',
    action: 'Contact former owner with offer',
    who: 'executive',
    details: 'Send introductory letter explaining they have unclaimed surplus funds. Include your credentials, the approximate amount, and offer to recover it for a 15% contingency fee. Follow up by phone 5-7 days after letter. NEVER misrepresent the amount or your role.',
    tools: ['Mail', 'Phone', 'Certified letter template'],
    estimatedTime: '1-7 days for response',
    approvalRequired: true,
  },
  {
    step: 5,
    phase: 'AGREEMENT',
    action: 'Sign contingency agreement',
    who: 'executive',
    details: 'If former owner agrees, sign the contingency agreement (max 15% in NY). Collect necessary documentation: proof of identity, proof of former ownership, any estate documents if owner is deceased (heirs claim). 3-day cancellation window required.',
    tools: ['Agreement template', 'Notary (if needed)'],
    estimatedTime: '1-3 days',
    approvalRequired: true,
  },
  {
    step: 6,
    phase: 'FILING',
    action: 'File surplus claim with court',
    who: 'system',
    details: 'Prepare and file Notice of Motion and Notice of Claim with the county clerk in the In Rem action. Pay filing fee ($45 in Sullivan County, varies by county). Include signed agreement, proof of ownership, identity documents.',
    tools: ['Court filing system', 'Claim form packet'],
    estimatedTime: '1-2 days to prepare, same day to file',
    approvalRequired: true,
  },
  {
    step: 7,
    phase: 'PROCESSING',
    action: 'Monitor claim through court',
    who: 'system',
    details: 'Track the claim through the court system. Respond to any requests for additional documentation. Typical processing time is 30-120 days depending on county backlog.',
    tools: ['Court case tracker', 'Calendar reminders'],
    estimatedTime: '30-120 days',
    approvalRequired: false,
  },
  {
    step: 8,
    phase: 'RECOVERY',
    action: 'Receive and distribute funds',
    who: 'executive',
    details: 'Court issues order approving the claim. County treasurer releases funds. Deposit check. Calculate 15% fee. Send remaining 85% to client. Issue 1099 if required. Update case to CLOSED.',
    tools: ['Bank account', 'Accounting system', 'Invoice generator'],
    estimatedTime: '1-2 weeks after court order',
    approvalRequired: true,
  },
];

export const REVENUE_PROJECTIONS = {
  perCase: {
    averageSurplus: 5000,
    feeRate: 0.15,
    averageFee: 750,
    filingCost: 45,
    netPerCase: 705,
  },
  monthly: {
    casesPerMonth: 3,
    monthlyRevenue: 2115,
    monthlyCosts: 135,
    monthlyNet: 1980,
  },
  rampUp: {
    month1: 'Obtain surplus lists from 2-3 counties, identify 10-20 prospects',
    month2: 'First outreach letters sent, first agreements signed',
    month3: 'First claims filed, continue prospecting new counties',
    month4_6: 'First claims approved, first revenue received, scale to 5-6 counties',
    month7_12: 'Steady state: 5-10 claims per month, $3,500-$7,500/month net revenue',
  },
  toFirst500: {
    fastestPath: 'Find a surplus of $3,334+ (15% = $500). One case.',
    timeToRevenue: '2-4 months from first outreach to first check received',
    upfrontCost: 'Filing fees only ($45-$100 per claim). No other mandatory costs.',
  },
};
