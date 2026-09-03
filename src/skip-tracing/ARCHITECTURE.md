# Skip Tracing Business Architecture

## TracerIO · Surplus Trust Group · Bounty Fund Finder

### Business Entities

| Entity | Role | Revenue Model |
|---|---|---|
| **TracerIO** | Skip tracing operations — locates individuals for debt recovery, legal process, asset recovery, insurance, and compliance | Per-trace fees, bulk contracts, subscription tiers |
| **Surplus Trust Group** | Surplus funds recovery — identifies and claims unclaimed funds from tax sales, foreclosures, estates, and government surplus | Contingency fee (% of recovered funds) |
| **Bounty Fund Finder** | Bounty and reward recovery — locates individuals or assets tied to bounties, unclaimed rewards, and finder's fees | Success-based bounty split, flat finder's fees |

---

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                 EXECUTIVE DASHBOARD                  │
│  (Unified view across all three business entities)   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              CENTRAL ORCHESTRATOR                    │
│  • Route cases to correct specialist workflow        │
│  • Enforce SOP policies and approval gates           │
│  • Maintain audit trail                              │
│  • Generate executive summaries                      │
└──┬───────────┬───────────┬───────────┬──────────────┘
   │           │           │           │
   ▼           ▼           ▼           ▼
┌──────┐  ┌──────────┐  ┌──────┐  ┌──────────┐
│INTAKE│  │RESEARCH  │  │VERIFY│  │OUTREACH  │
│Agent │  │Agent     │  │Agent │  │Agent     │
└──────┘  └──────────┘  └──────┘  └──────────┘
   │           │           │           │
   ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────┐
│              COMPLIANCE & AUDIT LAYER                │
│  • FCRA / FDCPA / GLBA compliance checks             │
│  • State-specific regulations (NY, etc.)             │
│  • Data retention and purge policies                 │
│  • Permissible purpose validation                    │
└─────────────────────────────────────────────────────┘
```

---

### Specialist Agents (Narrowly Scoped)

| Agent | Scope | Permissions | Approval Required |
|---|---|---|---|
| **Intake Agent** | Receive new cases, validate data, assign to correct entity | Read client data, create cases | Never (auto) |
| **Research Agent** | Database searches, public records, skip trace execution | Read-only data sources, write to case notes | Never (auto) |
| **Verification Agent** | Confirm identities, validate addresses, cross-reference | Read case data, flag discrepancies | Sensitive matches |
| **Outreach Agent** | Contact located individuals, send notices | Read case data, send templated comms | Always for first contact |
| **Recovery Agent** | File claims, process surplus fund paperwork | Read/write case data, generate documents | Always for filings |
| **Billing Agent** | Invoice clients, track payments, calculate contingency fees | Read case data, create invoices | Payments > $500 |
| **Compliance Agent** | Audit actions, flag violations, enforce data retention | Read all logs, flag/block actions | Never (auto-enforce) |

---

### Approval Gates (Hard Thresholds)

| Action | Threshold | Approver |
|---|---|---|
| Outbound contact to located person | Always | Executive |
| Surplus fund claim filing | Always | Executive |
| Payment/invoice > $500 | Always | Executive |
| Bulk data purchase | Always | Executive |
| New client onboarding | > $5,000 value | Executive |
| Case escalation to legal | Always | Executive |
| Data purge/retention override | Always | Executive |
| External API spend > $100/day | Always | Executive |

---

### Case Lifecycle

```
NEW → INTAKE → RESEARCH → LOCATED → VERIFIED → OUTREACH → RECOVERY → CLOSED
                  │            │          │          │          │
                  ▼            ▼          ▼          ▼          ▼
              DEAD_END    UNVERIFIED  DECLINED   PENDING    DISPUTED
```

### Data Model

- **Cases**: Central record linking a search subject to a business entity
- **Subjects**: Individuals or entities being traced
- **Clients**: Who commissioned the trace/recovery
- **Activities**: Immutable audit log of every action
- **Documents**: Generated letters, filings, reports
- **Billing**: Invoices, payments, contingency calculations

---

### Compliance Framework

1. **FCRA (Fair Credit Reporting Act)**: Permissible purpose required for every trace
2. **FDCPA (Fair Debt Collection Practices Act)**: Communication restrictions, validation notices
3. **GLBA (Gramm-Leach-Bliley Act)**: Financial data privacy
4. **NY State**: Additional consumer protections, licensing requirements
5. **TCPA**: Telephone/text contact restrictions
6. **CAN-SPAM**: Email communication rules

### Technology Stack

- **Frontend**: React/TypeScript (existing ADgorhythms app)
- **Backend**: Supabase (existing) for durable state
- **Workflows**: n8n for automated pipelines
- **Notifications**: Slack/Email for approval gates
- **Audit**: Immutable activity log in Supabase
- **Search APIs**: TLOxp, IRB Search, Accurint (integration-ready)
