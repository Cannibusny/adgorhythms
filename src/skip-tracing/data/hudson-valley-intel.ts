// Hudson Valley Surplus Funds Intelligence
// Compiled from public records research - September 2026

export const LEGAL_FRAMEWORK = {
  supremeCourtCase: 'Tyler v. Hennepin County, Minnesota (2023)',
  ruling: 'Counties CANNOT keep surplus from tax sales beyond what is owed in taxes, fees, and costs',
  nyResponse: 'Article 11 Part BB amendment — confirmed rights of former owners to claim surplus',
  statute: 'RPTL Section 1197 — Claims for Surplus',
  feeCapPercent: 15,
  feeCapNote: 'New York caps contingency fees for surplus recovery at 15%. Agreements above this are unenforceable.',
  claimWindow: '3 years from confirmation of report of sale (residential)',
  filingFee: 45,
  surplusDetermination: 'Enforcing officer determines surplus within 45 days of sale and pays into court',
  statewidePot: '$19 billion in unclaimed funds statewide (NY Comptroller)',
};

export interface CountyIntel {
  name: string;
  state: string;
  surplusContact: string;
  phone: string;
  website: string;
  claimFormUrl: string;
  notes: string;
  lastAuctionDate: string;
  status: 'active_surplus' | 'pending_list' | 'needs_research';
}

export const HUDSON_VALLEY_COUNTIES: CountyIntel[] = [
  {
    name: 'Ulster County',
    state: 'NY',
    surplusContact: 'Ulster County Finance Department / Comptroller March Gallagher',
    phone: '(845) 340-3000',
    website: 'https://www.ulstercountyny.gov/Departments/Finance/Tax-Information/Foreclosures-and-Tax-Auctions',
    claimFormUrl: 'https://www.ulstercountyny.gov/Departments/Finance/Tax-Information/Foreclosures-and-Tax-Auctions/Surplus-Foreclosure-Claim-Forms',
    notes: '2024 auction had high proceeds with surplus returned to former owners. No 2025 auction while implementing Tyler v. Hennepin law changes. Claim forms available online. This is HOME COUNTY — closest to New Paltz.',
    lastAuctionDate: 'Fall 2024',
    status: 'active_surplus',
  },
  {
    name: 'Dutchess County',
    state: 'NY',
    surplusContact: 'Dutchess County Treasurer / Supreme Court Clerk',
    phone: '(845) 486-2025',
    website: '',
    claimFormUrl: '',
    notes: 'Contact Treasurer or Supreme Court Clerk for surplus list. Poughkeepsie is county seat.',
    lastAuctionDate: '',
    status: 'needs_research',
  },
  {
    name: 'Orange County',
    state: 'NY',
    surplusContact: 'Orange County Clerk / Treasurer',
    phone: '(845) 291-2690',
    website: '',
    claimFormUrl: '',
    notes: 'Goshen is county seat. Contact clerk for surplus list availability.',
    lastAuctionDate: '',
    status: 'needs_research',
  },
  {
    name: 'Sullivan County',
    state: 'NY',
    surplusContact: 'Sullivan County Treasurer',
    phone: '(845) 807-0200',
    website: 'https://www.sullivanny.gov/Departments/Treasurer/Foreclosures',
    claimFormUrl: 'https://www.sullivanny.gov/sites/default/files/departments/RealProperty/Claim%20Form%20Packet.pdf',
    notes: 'Has online surplus funds page and claim form packet. $45 filing fee with County Clerk. Monticello is county seat.',
    lastAuctionDate: '',
    status: 'active_surplus',
  },
  {
    name: 'Columbia County',
    state: 'NY',
    surplusContact: 'Columbia County Treasurer',
    phone: '(518) 828-0513',
    website: '',
    claimFormUrl: '',
    notes: 'Hudson is county seat. Contact treasurer for surplus list.',
    lastAuctionDate: '',
    status: 'needs_research',
  },
  {
    name: 'Greene County',
    state: 'NY',
    surplusContact: 'Greene County Treasurer',
    phone: '(518) 719-3530',
    website: '',
    claimFormUrl: '',
    notes: 'Catskill is county seat. Contact treasurer for surplus list.',
    lastAuctionDate: '',
    status: 'needs_research',
  },
];

export const CONTINGENCY_AGREEMENT_TEMPLATE = `
SURPLUS FUNDS RECOVERY AGREEMENT

This Agreement is entered into as of __________, 20___, between:

SURPLUS TRUST GROUP ("Recovery Agent")
56 Main Street, New Paltz, NY 12561

and

_________________________ ("Client/Former Property Owner")
Address: _________________________

RECITALS:
The Client may be entitled to surplus funds resulting from a tax foreclosure
sale of real property formerly owned by the Client, located at:

Property Address: _________________________
County: _________________________, New York
Parcel ID: _________________________
Approximate Surplus Amount: $__________

TERMS:
1. SERVICES: Recovery Agent will research, locate, and file all necessary
   claims to recover surplus funds on behalf of Client.

2. FEE: Client agrees to pay Recovery Agent a contingency fee of ____%
   (not to exceed 15% per New York law) of the gross surplus funds
   recovered, payable only upon successful recovery.

3. COSTS: Recovery Agent will advance all filing fees and costs.
   These costs will be reimbursed from recovered funds before
   calculating the contingency fee.

4. NO RECOVERY, NO FEE: If no surplus funds are recovered, Client
   owes nothing.

5. DURATION: This agreement remains in effect until the claim is
   resolved or 12 months from signing, whichever comes first.

6. CANCELLATION: Client may cancel this agreement within 3 business
   days of signing with no obligation.

7. CLIENT REPRESENTATIONS: Client represents they are the former owner
   of the above property or their legal heir/successor.

_________________________     _________________________
Client Signature / Date       Recovery Agent Signature / Date

_________________________     Surplus Trust Group
Print Name                    By: Sheridan Williams, Principal
`;
