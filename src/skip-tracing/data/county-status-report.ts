// Surplus Trust Group — County-by-County Intelligence Report
// Compiled: September 3, 2026
// Status: ACTIVE INVESTIGATION

export interface CountyStatus {
  county: string;
  tier: 'A' | 'B' | 'C';
  avgPropertyValue: string;
  surplusStatus: string;
  keyFindings: string[];
  nextActions: string[];
  contacts: { role: string; detail: string }[];
  publicDataSources: string[];
  estimatedSurplusPool: string;
}

export const COUNTY_REPORTS: CountyStatus[] = [
  {
    county: 'Westchester County',
    tier: 'A',
    avgPropertyValue: '$850,000 (auction avg), $699K-$770K (median sale)',
    surplusStatus: 'HIGHEST PRIORITY — largest surplus pool in the region',
    keyFindings: [
      '58 properties currently on auction, avg estimated value $850,412',
      '1,935 total foreclosures tracked, 104 headed for auction',
      'State Comptroller audit (Aug 2024) found $203,279 IMPROPERLY held — should have been turned over as abandoned property',
      'Commissioner of Finance at 148 Martine Ave, Room 720, White Plains NY 10601 holds all surplus from court orders',
      'Publishes annual unclaimed property notice with names — PDF lists exist online at finance.westchestercountyny.gov',
      'Weekly foreclosure lists from County Clerk include mortgagor, mortgagee, property location, pending court action',
      'Surplus money from foreclosures deposited via court-certified Referee Report of Sale',
      'Funds held 3+ years without claim get sent to NYS Comptroller each April — DEADLINE PRESSURE creates urgency for owners',
    ],
    nextActions: [
      'PRIORITY 1: Visit Westchester County Clerk online records search to pull weekly foreclosure list',
      'PRIORITY 2: Request unclaimed property list from Commissioner of Finance (148 Martine Ave, White Plains)',
      'PRIORITY 3: Search NY eCourts for surplus money proceedings with Westchester County index numbers',
      'PRIORITY 4: Cross-reference foreclosure list with surplus money proceedings to find cases with deposits',
      'Submit FOIL via online form at westchestergov.com/contact-us/foil-form (more likely to be processed than email)',
    ],
    contacts: [
      { role: 'Commissioner of Finance (Surplus)', detail: '148 Martine Ave, Room 720, White Plains NY 10601' },
      { role: 'County Clerk (Foreclosure Lists)', detail: '110 Dr. Martin Luther King Jr. Blvd, White Plains — open 8:30am-4:30pm M-F' },
      { role: 'FOIL Request', detail: 'westchestergov.com/contact-us/foil-form (online form)' },
    ],
    publicDataSources: [
      'finance.westchestercountyny.gov/services/unclaimed-property — unclaimed property page',
      'finance.westchestercountyny.gov/services/court-and-trust-funds — court and trust fund info',
      'westchesterclerk.com — weekly foreclosure lists, online record search',
      'osc.ny.gov audit 2024-C&T-3 — State audit of court and trust funds',
    ],
    estimatedSurplusPool: '$203,279 confirmed improperly held (audit). Actual pool likely $1M+ given property values and foreclosure volume.',
  },
  {
    county: 'Ulster County',
    tier: 'A',
    avgPropertyValue: '$250,000-$400,000 (Hudson Valley market)',
    surplusStatus: 'ACTIVE — 2024 auction generated surplus, returned to former owners under new law',
    keyFindings: [
      'Fall 2024 tax auction recorded HIGH PROCEEDS with surplus returned to former owners',
      'NO 2025 auction — county implementing Tyler v. Hennepin law changes',
      'Comptroller March Gallagher released Delinquent Real Property Tax Auction Report (July 21, 2025)',
      'Surplus claim forms and instructions available online',
      'Moved to online auctions, changed auctioneer and software platforms',
      'Now enforcing taxes for Villages of Ellenville and Saugerties going forward',
      'HOME COUNTY — closest to our base at 56 Main St, New Paltz',
    ],
    nextActions: [
      'PRIORITY 1: Call Comptroller office (845-331-8774) to request auction report with parcel-level detail',
      'PRIORITY 2: Download surplus claim forms from county website',
      'PRIORITY 3: Review AAR Auctions site for 2024 auction results (auctionId=6845)',
      'PRIORITY 4: Check if any surplus from pre-2024 auctions remains unclaimed',
    ],
    contacts: [
      { role: 'Comptroller', detail: 'March Gallagher — CountyComptroller@ulstercountyny.gov — (845) 331-8774' },
      { role: 'Finance Dept', detail: '244 Fair St, PO Box 1800, Kingston NY 12402 — (845) 340-3000' },
      { role: 'FOIL', detail: 'ulstercountyny.gov/Government/Transparency/FOIL-Information' },
    ],
    publicDataSources: [
      'ulstercountyny.gov/Departments/Finance/Tax-Information/Foreclosures-and-Tax-Auctions — main page',
      'ulstercountyny.gov surplus claim forms page',
      'comptroller.ulstercountyny.gov — audit reports and press releases',
      'aarauctions.com — online auction results',
      'gis.ulstercountyny.gov/parcel-viewer — parcel viewer for property research',
    ],
    estimatedSurplusPool: 'Unknown exact amount. 2024 auction had "high proceeds" — likely $500K-$2M in total surplus generated.',
  },
  {
    county: 'Dutchess County',
    tier: 'B',
    avgPropertyValue: '$350,000-$500,000',
    surplusStatus: 'NEEDS DIRECT INVESTIGATION',
    keyFindings: [
      'Comptroller office handles financial records FOIL: comptroller@dutchessny.gov',
      'County has transparency portal through Comptroller office',
      'Poughkeepsie is county seat — active real estate market',
      'No public surplus list found in search results',
    ],
    nextActions: [
      'PRIORITY 1: Email comptroller@dutchessny.gov with subject "Comptroller\'s Office: FOIL Request"',
      'PRIORITY 2: Search NY eCourts for Dutchess County surplus money proceedings',
      'PRIORITY 3: Contact Supreme Court Clerk for referee reports of sale',
    ],
    contacts: [
      { role: 'Comptroller FOIL', detail: 'comptroller@dutchessny.gov — put "Comptroller\'s Office: FOIL Request" in subject' },
      { role: 'General FOIL', detail: 'dutchessny.gov/County-Government/Dutchess-County-Government-FOIL-Request.htm' },
    ],
    publicDataSources: [
      'dutchessny.gov — Comptroller Government Transparency page',
    ],
    estimatedSurplusPool: 'Unknown. Property values suggest meaningful surplus potential.',
  },
  {
    county: 'Orange County',
    tier: 'B',
    avgPropertyValue: '$300,000-$450,000',
    surplusStatus: 'NEEDS DIRECT INVESTIGATION',
    keyFindings: [
      'Goshen is county seat',
      'No verified FOIL contact found — email sent to treasurer@orangecountygov.com (unverified)',
      'Active foreclosure market',
    ],
    nextActions: [
      'PRIORITY 1: Call Orange County main line to get correct FOIL/surplus contact',
      'PRIORITY 2: Search NY eCourts for Orange County surplus money proceedings',
    ],
    contacts: [
      { role: 'General', detail: '(845) 291-2690' },
    ],
    publicDataSources: [],
    estimatedSurplusPool: 'Unknown. Mid-range property values — moderate surplus potential.',
  },
  {
    county: 'Sullivan County',
    tier: 'B',
    avgPropertyValue: '$150,000-$300,000',
    surplusStatus: 'HAS PUBLIC INFRASTRUCTURE — surplus page and claim forms online',
    keyFindings: [
      'County website has dedicated Foreclosures/Surplus Funds page',
      'Claim Form Packet available as PDF download',
      '$45 filing fee with County Clerk for Notice of Claim',
      'FOIL Officer is Rosie Savaglio — accepts fax and email',
      'Monticello is county seat',
    ],
    nextActions: [
      'PRIORITY 1: Download and review claim form packet from sullivanny.gov',
      'PRIORITY 2: Contact FOIL Officer Rosie Savaglio for surplus data list',
      'PRIORITY 3: Search NY eCourts for Sullivan County surplus proceedings',
    ],
    contacts: [
      { role: 'Treasurer/Surplus', detail: 'sullivanny.gov/Departments/Treasurer/Foreclosures' },
      { role: 'FOIL Officer', detail: 'Rosie Savaglio — sullivanny.gov/Departments/Countymanager/Foil' },
      { role: 'General', detail: '(845) 807-0200' },
    ],
    publicDataSources: [
      'sullivanny.gov/Departments/Treasurer/Foreclosures — surplus funds page',
      'sullivanny.gov claim form packet PDF',
    ],
    estimatedSurplusPool: 'Lower property values but high foreclosure volume. Surplus per case smaller but more cases available.',
  },
  {
    county: 'Rockland County',
    tier: 'B',
    avgPropertyValue: '$400,000-$600,000',
    surplusStatus: 'NEEDS DEPARTMENT-SPECIFIC INVESTIGATION',
    keyFindings: [
      'NO county-wide Records Access Officer — must specify department',
      'Has FOIL request system and Subject Matter directory to identify correct department',
      'Claims pursued under original foreclosure action in Rockland County Supreme Court',
      'New City is county seat',
    ],
    nextActions: [
      'PRIORITY 1: Use Rockland County FOIL Subject Matter directory to find surplus funds department',
      'PRIORITY 2: Submit FOIL through online system at rocklandcountyny.gov/services-directory/foil-request',
      'PRIORITY 3: Search NY eCourts for Rockland County surplus proceedings',
    ],
    contacts: [
      { role: 'FOIL System', detail: 'rocklandcountyny.gov/services-directory/foil-request' },
      { role: 'Subject Matter Directory', detail: 'rocklandcountyny.gov/departments/county-executive/foil-subject-matter-list' },
    ],
    publicDataSources: [
      'rocklandcountyny.gov FOIL directory',
    ],
    estimatedSurplusPool: 'Higher property values — good surplus potential per case.',
  },
  {
    county: 'Putnam County',
    tier: 'B',
    avgPropertyValue: '$400,000-$550,000',
    surplusStatus: 'FOIL ROUTING CONFIRMED',
    keyFindings: [
      'FOIL email confirmed: foil.officer@putnamcountyny.gov',
      'All FOIL requests processed through County Clerk, forwarded to appropriate agency',
      'Mailing: Putnam County Clerk, 40 Gleneida Ave, Room 100, Carmel NY 10512',
      'Phone: 845-808-1142',
      'Carmel is county seat',
    ],
    nextActions: [
      'PRIORITY 1: Send corrected FOIL to foil.officer@putnamcountyny.gov',
      'PRIORITY 2: Search NY eCourts for Putnam County surplus proceedings',
    ],
    contacts: [
      { role: 'FOIL Officer', detail: 'foil.officer@putnamcountyny.gov' },
      { role: 'County Clerk', detail: '40 Gleneida Ave, Room 100, Carmel NY 10512 — (845) 808-1142' },
    ],
    publicDataSources: [],
    estimatedSurplusPool: 'Solid property values in Putnam — good surplus potential.',
  },
  {
    county: 'Columbia County',
    tier: 'C',
    avgPropertyValue: '$200,000-$400,000',
    surplusStatus: 'MINIMAL INTEL — needs ground-level research',
    keyFindings: [
      'Hudson is county seat',
      'Sheriff FOIL contact: 518-828-0601 ext. 1415',
      'No specific surplus or treasurer contact verified',
    ],
    nextActions: [
      'PRIORITY 1: Call county main line to get correct surplus/treasurer contact',
      'PRIORITY 2: Search NY eCourts for Columbia County surplus proceedings',
    ],
    contacts: [
      { role: 'Sheriff FOIL', detail: '518-828-0601 ext. 1415' },
      { role: 'General', detail: '(518) 828-0513' },
    ],
    publicDataSources: [],
    estimatedSurplusPool: 'Lower volume market but gentrifying — some high-value properties.',
  },
  {
    county: 'Greene County',
    tier: 'C',
    avgPropertyValue: '$150,000-$300,000',
    surplusStatus: 'MINIMAL INTEL — needs ground-level research',
    keyFindings: [
      'Catskill is county seat',
      'No verified contacts found',
    ],
    nextActions: [
      'PRIORITY 1: Call county main line to get correct surplus/treasurer contact',
      'PRIORITY 2: Search NY eCourts for Greene County surplus proceedings',
    ],
    contacts: [
      { role: 'General', detail: '(518) 719-3530' },
    ],
    publicDataSources: [],
    estimatedSurplusPool: 'Lower property values — focus here only after exhausting Tier A and B counties.',
  },
];

export const INVESTIGATION_SUMMARY = {
  totalCounties: 9,
  tierA: ['Westchester County', 'Ulster County'],
  tierB: ['Dutchess County', 'Orange County', 'Sullivan County', 'Rockland County', 'Putnam County'],
  tierC: ['Columbia County', 'Greene County'],

  biggestOpportunity: 'Westchester County — $850K avg auction value, $203K confirmed improperly held, published unclaimed property lists with names, 1,935 foreclosures tracked. One surplus case here could be worth $10K-$50K+ in fees.',

  immediateActions: [
    '1. Search NY eCourts system for surplus money proceedings across all 9 counties — this is FREE and PUBLIC, no FOIL needed',
    '2. Pull Westchester County weekly foreclosure list from County Clerk — FREE and PUBLIC',
    '3. Request Westchester unclaimed property list from Commissioner of Finance — PUBLISHED ANNUALLY',
    '4. Call Ulster County Comptroller (845-331-8774) for 2024 auction report with parcel detail',
    '5. Download Sullivan County claim form packet from their website',
    '6. Submit corrected FOILs via online forms where available (Westchester, Rockland, Putnam)',
  ],

  legalFramework: {
    statute: 'RPTL Section 1197',
    supremeCourtCase: 'Tyler v. Hennepin County (2023) — counties CANNOT keep surplus',
    nyAmendment: 'Article 11 Part BB — confirmed former owner rights to surplus',
    feeCap: '15% maximum contingency fee in New York',
    claimWindow: '3 years from confirmation of report of sale (residential)',
    abandonmentRule: 'Unclaimed surplus after 3 years goes to NYS Comptroller (or tax district) — creates urgency',
  },

  foilStatus: {
    sent: 9,
    confirmedCorrectAddress: ['Sullivan County (treasurer@sullivanny.gov)'],
    confirmedWrongAddress: [
      'Ulster (sent to comptroller@co.ulster.ny.us — correct is CountyComptroller@ulstercountyny.gov)',
      'Putnam (sent to putnamcountyclerk@putnamcountyny.gov — correct is foil.officer@putnamcountyny.gov)',
      'Dutchess (sent to countyclerk — should be comptroller@dutchessny.gov for financial records)',
    ],
    unverified: ['Orange', 'Columbia', 'Greene', 'Westchester', 'Rockland'],
    fromAddress: 'PROBLEM: All sent from mrsjw136@gmail.com, not sheridan@adgorhythms.com',
  },
};
