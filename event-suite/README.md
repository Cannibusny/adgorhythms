# ADgorhythms Event Suite — Phase 1

**Autonomous Authentication & Credential Management System**

A secure, multi-tenant credential vault that lets event promoters connect their marketing and payment accounts once, then manages those connections autonomously.

## What It Does

- **OAuth Flows** — Meta Ads, Google Ads, and Stripe connect via standard OAuth
- **API Key Storage** — Twilio and Klaviyo credentials stored encrypted (AES-256)
- **Auto Token Refresh** — Daily cron job refreshes tokens 7 days before expiry
- **Multi-Tenant Isolation** — Each promoter's credentials are fully isolated
- **Admin Dashboard** — Visual status of all connected platforms

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ / Express |
| Database | PostgreSQL |
| Encryption | AES-256-CBC with random IVs |
| Auth | Session-based (scrypt password hashing) |
| Hosting | Railway |

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env

# Generate an encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run database migration
npm run db:migrate

# Start the server
npm start
```

## Environment Variables

See `.env.example` for the full list. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `ENCRYPTION_KEY` — 32-byte hex string for AES-256
- `SESSION_SECRET` — Random string for session cookies
- `META_APP_ID` / `META_APP_SECRET` — Facebook app credentials
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `STRIPE_SECRET_KEY` / `STRIPE_CLIENT_ID` — Stripe Connect credentials
- `BASE_URL` — Public URL of the deployed app

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/credentials` | List credential statuses (auth required) |
| POST | `/api/test/:platform` | Test a platform connection (auth required) |

## OAuth Endpoints

| Platform | Connect | Callback |
|----------|---------|----------|
| Meta | `GET /oauth/meta/connect` | `GET /oauth/meta/callback` |
| Google | `GET /oauth/google/connect` | `GET /oauth/google/callback` |
| Stripe | `GET /oauth/stripe/connect` | `GET /oauth/stripe/callback` |

## API Key Endpoints

| Platform | Settings Page | Save |
|----------|--------------|------|
| Twilio | `GET /settings/twilio` | `POST /settings/twilio/save` |
| Klaviyo | `GET /settings/klaviyo` | `POST /settings/klaviyo/save` |

## Adding a New OAuth Platform

1. Create a new route file in `src/routes/oauth/<platform>.js`
2. Implement `/connect` (redirect to OAuth consent) and `/callback` (exchange code for tokens)
3. Encrypt tokens with `encrypt()` from `src/utils/encryption.js`
4. Store in the `credentials` table with the platform name
5. Add refresh logic to `src/utils/refreshTokens.js`
6. Register the route in `src/index.js`
7. Add the platform to the `PLATFORMS` array in `src/routes/dashboard.js`

## Architecture

```
src/
├── index.js              # Express app entry point
├── db/
│   ├── index.js          # PostgreSQL pool
│   └── migrate.js        # Schema migration
├── middleware/
│   └── auth.js           # Session auth guard
├── routes/
│   ├── auth.js           # Login / register / logout
│   ├── dashboard.js      # Dashboard page
│   ├── oauth/
│   │   ├── meta.js       # Meta (Facebook) OAuth
│   │   ├── google.js     # Google OAuth
│   │   └── stripe.js     # Stripe Connect OAuth
│   └── api/
│       ├── twilio.js     # Twilio credential management
│       ├── klaviyo.js    # Klaviyo credential management
│       └── status.js     # Health & status API
├── utils/
│   ├── encryption.js     # AES-256 encrypt / decrypt
│   ├── refreshTokens.js  # Token refresh logic
│   ├── alerts.js         # Promoter alerting
│   └── api/
│       ├── meta.js       # Meta Ads API helpers
│       ├── google.js     # Google Ads API helpers
│       ├── stripe.js     # Stripe API helpers
│       ├── twilio.js     # Twilio SMS helpers
│       └── klaviyo.js    # Klaviyo event helpers
├── jobs/
│   └── tokenRefresher.js # Daily cron for token refresh
└── views/
    ├── layout.ejs        # Shared layout
    ├── login.ejs         # Login page
    ├── register.ejs      # Registration page
    ├── dashboard.ejs     # Dashboard page
    ├── twilio-settings.ejs
    └── klaviyo-settings.ejs
```

## License

MIT
