# Cannibus NY Automation Engine

Node.js/TypeScript Express service and n8n workflow blueprints powering hands-free lead capture,
SMS notifications, and scheduled AI content generation for Cannibus NY (New Paltz, NY).

## Contents

| Path | Purpose |
| --- | --- |
| `src/` | Express webhook API (`POST /api/v1/lead-capture`) |
| `workflows/lead-capture-automation.json` | n8n: Webhook → Klaviyo profile → Twilio SMS |
| `workflows/weekly-seo-blog-agent.json` | n8n: Monday 8:00 AM EST → OpenAI article → CMS draft |
| `Dockerfile` / `docker-compose.yml` | Production container + local verification |

## Local development

```bash
cd services/cannibusny-automation-engine
npm install
cp .env.example .env   # fill in real credentials
npm run dev            # http://localhost:3000
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm test
```

## API

### `POST /api/v1/lead-capture`

Request body:

```json
{
  "firstName": "Jamie",
  "email": "jamie@example.com",
  "phone": "(845) 555-0123",
  "source": "grand-opening-landing"
}
```

`firstName`, `email` and `phone` are required; `source` defaults to `website`. Phone numbers are
normalized to E.164 (US default region), emails are trimmed and lower-cased.

On success the endpoint upserts a Klaviyo profile tagged `VIP-Founding-Member`, sends the Twilio
welcome SMS, and returns:

```json
{ "success": true, "message": "Lead logged and SMS triggered" }
```

Failure responses:

| Status | Condition |
| --- | --- |
| `400` | Missing/invalid field — body includes an `errors` array |
| `502` | Klaviyo upsert failed (no SMS is sent) or SMS delivery failed after the lead was logged |

### `GET /healthz`

Returns `{ "status": "ok" }` — use it as the platform health check.

## Environment variables

See `.env.example`. `PORT`, `KLAVIYO_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_PHONE_NUMBER` are used by the API; `OPENAI_API_KEY`, `CMS_API_ENDPOINT`, `CMS_BEARER_TOKEN`
are consumed by the n8n blog agent workflow.

## Docker

```bash
docker build -t cannibusny-automation-engine .
docker compose up --build   # requires a local .env
curl http://localhost:3000/healthz
```

## Deploying to Render

1. Push this repository to GitHub (already done if you are reading this in the repo).
2. Render dashboard → **New → Web Service** → connect `Cannibusny/adgorhythms`.
3. **Root Directory**: `services/cannibusny-automation-engine`.
4. **Runtime**: Docker (Render auto-detects the `Dockerfile`). Leave build/start commands empty.
   For a non-Docker Node service instead use Build Command `npm ci && npm run build` and
   Start Command `npm start`.
5. **Health Check Path**: `/healthz`.
6. **Environment** tab → add every key from `.env.example` with real values. Render injects `PORT`
   automatically; the app reads it.
7. Click **Create Web Service**. Your webhook URL is
   `https://<service-name>.onrender.com/api/v1/lead-capture`.

## Deploying to Railway

1. Railway dashboard → **New Project → Deploy from GitHub repo** → `Cannibusny/adgorhythms`.
2. Service **Settings → Root Directory**: `services/cannibusny-automation-engine`.
   Railway detects the `Dockerfile` and builds it; no build/start command is needed.
3. **Variables** tab → add all keys from `.env.example` (omit `PORT`; Railway sets it).
4. **Settings → Networking → Generate Domain** to expose the service publicly.
5. Verify: `curl https://<domain>/healthz`.

CLI alternative:

```bash
railway login
railway link
railway up --service cannibusny-automation-engine
```

## Importing the n8n workflows

1. n8n → **Workflows → Import from File** → select a file from `workflows/`.
2. Set the workflow environment variables (`KLAVIYO_API_KEY`, `TWILIO_PHONE_NUMBER`,
   `OPENAI_API_KEY`, `CMS_API_ENDPOINT`, `CMS_BEARER_TOKEN`) on the n8n instance.
3. `lead-capture-automation`: attach a Twilio credential to the **Twilio — Welcome SMS** node, then
   activate; the production webhook path is `/webhook/cannibusny-lead-capture`.
4. `weekly-seo-blog-agent`: confirm the workflow timezone is `America/New_York` so the cron
   `0 8 * * 1` fires Mondays at 8:00 AM EST, then activate.
