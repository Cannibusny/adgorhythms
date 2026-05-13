# ADgorhythms Event Suite — Profit Report

## Revenue Model

| Metric | Value |
|--------|-------|
| Target revenue per client | $500/month |
| Estimated active clients (Year 1) | 20 |
| Monthly Recurring Revenue (MRR) | $10,000 |
| Annual Recurring Revenue (ARR) | $120,000 |

## Operational Costs (Per Month)

| Item | Cost | Notes |
|------|------|-------|
| Railway hosting (Pro) | $20 | Starter plan, auto-scales |
| Railway Postgres | $7 | Included with Pro plan |
| Domain + SSL | $2 | ~$20/year amortized |
| Meta API | $0 | Free tier (no ad spend costs for API access) |
| Google Ads API | $0 | Free tier |
| Stripe fees | $0 | Charged to promoter's Stripe account, not ours |
| Twilio SMS (alerts only) | $5 | ~500 alerts/month at $0.0079/msg |
| Klaviyo | $0 | Promoter's own account |
| Error monitoring (future) | $0–$29 | Sentry free tier initially |
| **Total operational cost** | **~$34/month** | |

## Margin Analysis

| Metric | Value |
|--------|-------|
| Revenue per client | $500/month |
| Cost per client (at 20 clients) | $1.70/month |
| **Gross margin per client** | **$498.30 (99.7%)** |
| Breakeven clients | **1** (covers all infra at $34/month) |

## Scaling Projections

| Clients | MRR | Monthly Cost | Net Profit | Margin |
|---------|-----|-------------|------------|--------|
| 1 | $500 | $34 | $466 | 93.2% |
| 10 | $5,000 | $34 | $4,966 | 99.3% |
| 20 | $10,000 | $40 | $9,960 | 99.6% |
| 50 | $25,000 | $60 | $24,940 | 99.8% |
| 100 | $50,000 | $100 | $49,900 | 99.8% |

## Multi-Tenant Scaling (Copycat Engine)

The credential management system is designed for zero-code scaling:

- **Database-level isolation**: Each promoter's credentials are keyed by `promoter_id + platform` (unique constraint)
- **No per-client configuration**: New promoters register, connect their accounts, and the system handles everything
- **Horizontal scale**: PostgreSQL handles 100+ concurrent promoters with standard connection pooling
- **Token refresh**: Single cron job refreshes ALL promoters' tokens in one pass — no per-client jobs needed

### Cost to onboard new client: $0 (self-service)

## Build Cost Summary

| Phase | Development Cost | Ongoing Cost |
|-------|-----------------|-------------|
| Phase 1 (Auth & Credentials) | One-time build | $0/month |
| Infrastructure | — | ~$34/month |
| Support overhead (automated) | — | $0/month |

## Bottom Line

At **$500/month per promoter** with **~$34/month total infrastructure cost**, this system achieves **99%+ gross margins** from the first client onward. The multi-tenant architecture means each additional client adds pure revenue with negligible incremental cost.

**ROI at 10 clients: $4,966/month net profit ($59,592/year)**
