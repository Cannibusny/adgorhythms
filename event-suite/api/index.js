require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const db = require('../src/db');

// Routes
const authRoutes = require('../src/routes/auth');
const dashboardRoutes = require('../src/routes/dashboard');
const metaOAuthRoutes = require('../src/routes/oauth/meta');
const googleOAuthRoutes = require('../src/routes/oauth/google');
const stripeOAuthRoutes = require('../src/routes/oauth/stripe');
const twilioRoutes = require('../src/routes/api/twilio');
const klaviyoRoutes = require('../src/routes/api/klaviyo');
const statusRoutes = require('../src/routes/api/status');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'src', 'views'));

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/oauth/meta', metaOAuthRoutes);
app.use('/oauth/google', googleOAuthRoutes);
app.use('/oauth/stripe', stripeOAuthRoutes);
app.use('/settings/twilio', twilioRoutes);
app.use('/settings/klaviyo', klaviyoRoutes);
app.use('/api', statusRoutes);

// Root redirect
app.get('/', (_req, res) => {
  res.redirect('/dashboard');
});

// Disconnect routes for API-key platforms
app.post('/oauth/twilio/disconnect', (req, res, next) => {
  req.url = '/disconnect';
  twilioRoutes.handle(req, res, next);
});
app.post('/oauth/klaviyo/disconnect', (req, res, next) => {
  req.url = '/disconnect';
  klaviyoRoutes.handle(req, res, next);
});

// 404
app.use((_req, res) => {
  res.status(404).send('Not found');
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Auto-migrate on first request
let migrated = false;
const originalHandler = app;
module.exports = async (req, res) => {
  if (!migrated) {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS promoters (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          business_name VARCHAR(255),
          phone VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS credentials (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
          platform VARCHAR(50) NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          token_expires_at TIMESTAMP,
          api_key TEXT,
          account_id VARCHAR(255),
          status VARCHAR(20) DEFAULT 'active',
          last_refreshed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(promoter_id, platform)
        );
        CREATE INDEX IF NOT EXISTS idx_credentials_expiry
          ON credentials (token_expires_at) WHERE status = 'active';
        CREATE INDEX IF NOT EXISTS idx_credentials_promoter
          ON credentials (promoter_id);
      `);
      migrated = true;
    } catch (err) {
      console.error('Migration error:', err.message);
      migrated = true;
    }
  }
  return originalHandler(req, res);
};
