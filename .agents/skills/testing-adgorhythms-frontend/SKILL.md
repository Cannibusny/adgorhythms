---
name: testing-adgorhythms-frontend
description: Test ADgorhythms frontend pages end-to-end. Use when verifying UI changes across any of the 6 phases (CRM, Social Media, AI Content, Email/Analytics, SEO/Calendar, AI Enhancements + LuxeFlow).
---

# Testing ADgorhythms Frontend

## Prerequisites
- Node.js and npm installed
- Repository cloned at `/home/ubuntu/repos/adgorhythms`

## Starting the Dev Server

```bash
cd /home/ubuntu/repos/adgorhythms
npm run dev
```

The frontend runs on `http://localhost:5173/`.

## Backend

The Express backend (`server/`) requires Supabase credentials in `server/.env`. Without the backend:
- All pages render with empty states (no crashes)
- API-dependent features (data loading, form submissions) will silently fail
- Frontend-only interactions (tab switching, dropdowns, form inputs, navigation) still work

To run the backend:
```bash
cd /home/ubuntu/repos/adgorhythms/server
npm install
npm run dev  # Runs on port 3001
```
Requires `server/.env` with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

## Devin Secrets Needed
- `SUPABASE_URL` — Supabase project URL (for backend)
- `SUPABASE_SERVICE_KEY` — Supabase service role key (for backend)

## Page Routes by Phase

### Phase 1 — CRM & Marketing
- `/dashboard` — CRM Dashboard
- `/contacts` — Contacts list
- `/contacts/:id` — Contact detail
- `/deals` — Deals pipeline
- `/deals/:id` — Deal detail
- `/campaigns` — Email campaigns
- `/sequences` — Email sequences
- `/workflows` — Automation workflows

### Phase 2 — Social Media
- `/social/accounts` — Social accounts
- `/social/calendar` — Content calendar
- `/social/compose` — Compose post
- `/social/scheduled` — Scheduled posts
- `/social/analytics` — Post analytics
- `/social/inbox` — Social inbox
- `/social/hashtags` — Hashtag research
- `/social/competitors` — Competitor tracking

### Phase 3 — AI Content
- `/ai/generate` — AI generator
- `/ai/library` — Content library
- `/ai/brand-voice` — Brand voice settings
- `/ai/templates` — Content templates

### Phase 4 — Email Marketing & Analytics
- `/email/lists` — Email lists
- `/email/templates` — Email templates
- `/email/analytics` — Email analytics
- `/analytics` — Analytics overview
- `/analytics/traffic` — Traffic analytics
- `/analytics/conversions` — Conversion analytics
- `/analytics/attribution` — Attribution report
- `/analytics/revenue` — Revenue analytics

### Phase 5 — SEO & Scheduling
- `/seo/keywords` — Keyword research
- `/seo/backlinks` — Backlink analysis
- `/seo/audit` — Site audit
- `/seo/competitors` — SEO competitors
- `/seo/schema` — Schema markup generator
- `/calendar/settings` — Calendar settings
- `/calendar/widget` — Booking widget
- `/calendar/bookings` — Bookings calendar

### Phase 6 — AI Enhancements & LuxeFlow
- `/reviews/setup` — Review monitoring setup
- `/reviews` — Review dashboard
- `/reviews/inbox` — Review inbox
- `/reviews/recovery` — Recovery campaigns
- `/reviews/requests` — Review requests
- `/reviews/report` — Reputation report
- `/ai/lead-insights` — AI lead insights
- `/ai/journey-mapper` — Customer journey mapper
- `/ai/competitor-intel` — Competitor intelligence
- `/ai/ad-optimizer` — Ad optimizer
- `/ai/call-analyzer` — Sales call analyzer
- `/ai/churn-predictor` — Churn predictor
- `/ai/roi-dashboard` — ROI dashboard

## Testing Tips

- The sidebar is scrollable — LuxeFlow Reviews and AI Intelligence sections are near the bottom
- All pages gracefully handle missing backend data with empty states
- Tab switching, dropdowns, and form inputs work without backend
- The ADgorhythms logo appears at the top of the sidebar and links to `/dashboard`
- Brand colors: Cyan #00D4FF, Lime #B4FF00, Dark #1A1D29, Purple #6C47FF
- Default workspace ID used in API calls: `00000000-0000-0000-0000-000000000001`
