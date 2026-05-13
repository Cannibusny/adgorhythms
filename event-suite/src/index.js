require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const db = require('./db');

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const metaOAuthRoutes = require('./routes/oauth/meta');
const googleOAuthRoutes = require('./routes/oauth/google');
const stripeOAuthRoutes = require('./routes/oauth/stripe');
const twilioRoutes = require('./routes/api/twilio');
const klaviyoRoutes = require('./routes/api/klaviyo');
const statusRoutes = require('./routes/api/status');
const eventRoutes = require('./routes/events');
const checkinRoutes = require('./routes/checkin');

// Jobs
const { startTokenRefresher } = require('./jobs/tokenRefresher');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('short'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  store: new pgSession({
    pool: db.pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
}));

// Ensure POST redirects use 303 (GET) to prevent 307 method-preserving redirects
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const originalRedirect = res.redirect.bind(res);
    res.redirect = function redirect(statusOrUrl, url) {
      if (typeof statusOrUrl === 'string') {
        return originalRedirect(303, statusOrUrl);
      }
      return originalRedirect(statusOrUrl, url);
    };
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/oauth/meta', metaOAuthRoutes);
app.use('/oauth/google', googleOAuthRoutes);
app.use('/oauth/stripe', stripeOAuthRoutes);
app.use('/settings/twilio', twilioRoutes);
app.use('/settings/klaviyo', klaviyoRoutes);
app.use('/api', statusRoutes);
app.use('/events', eventRoutes);
app.use('/checkin', checkinRoutes);

// Root redirect
app.get('/', (_req, res) => {
  res.redirect('/dashboard');
});

// Disconnect routes for API-key platforms (Twilio/Klaviyo)
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

// Auto-run migration on startup
async function runMigration() {
  const migration = `
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

    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      event_date TIMESTAMP NOT NULL,
      location VARCHAR(500) NOT NULL,
      ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_capacity INTEGER NOT NULL DEFAULT 100,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_events_promoter
      ON events (promoter_id);

    CREATE TABLE IF NOT EXISTS tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      buyer_name VARCHAR(255) NOT NULL,
      buyer_email VARCHAR(255) NOT NULL,
      buyer_phone VARCHAR(50),
      ticket_code VARCHAR(64) UNIQUE NOT NULL,
      qr_code TEXT,
      amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(20) DEFAULT 'confirmed',
      checked_in_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_event
      ON tickets (event_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_code
      ON tickets (ticket_code);

    CREATE TABLE IF NOT EXISTS check_ins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      checked_in_by UUID REFERENCES promoters(id),
      checked_in_at TIMESTAMP DEFAULT NOW()
    );

    -- Check-In System tables (scalable multi-event architecture)
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      phone VARCHAR(50),
      source VARCHAR(100) DEFAULT 'manual',
      city VARCHAR(100),
      region VARCHAR(100),
      tags TEXT DEFAULT '',
      total_events_attended INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(email, promoter_id)
    );
    CREATE INDEX IF NOT EXISTS idx_contacts_promoter ON contacts (promoter_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);

    CREATE TABLE IF NOT EXISTS checkin_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      event_date TIMESTAMP NOT NULL,
      location VARCHAR(500) NOT NULL,
      city VARCHAR(100) DEFAULT '',
      region VARCHAR(100) DEFAULT 'NYC',
      currency VARCHAR(10) DEFAULT 'USD',
      status VARCHAR(20) DEFAULT 'active',
      followup_sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_checkin_events_promoter ON checkin_events (promoter_id);

    CREATE TABLE IF NOT EXISTS attendees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      checkin_event_id UUID REFERENCES checkin_events(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      table_type VARCHAR(50) DEFAULT 'General',
      table_size INTEGER DEFAULT 1,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      ticket_code VARCHAR(64) UNIQUE NOT NULL,
      qr_code TEXT,
      source VARCHAR(100) DEFAULT 'manual',
      sale_location VARCHAR(255) DEFAULT '',
      checked_in BOOLEAN DEFAULT false,
      checked_in_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees (checkin_event_id);
    CREATE INDEX IF NOT EXISTS idx_attendees_code ON attendees (ticket_code);
    CREATE INDEX IF NOT EXISTS idx_attendees_name ON attendees (LOWER(name));

    CREATE TABLE IF NOT EXISTS checkin_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
      checkin_event_id UUID REFERENCES checkin_events(id) ON DELETE CASCADE,
      checked_in_by UUID REFERENCES promoters(id),
      checked_in_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await db.query(migration);
    console.log('Database migration complete');
  } catch (err) {
    console.error('Migration error (may be expected on first run):', err.message);
  }
}

// Start
async function start() {
  await runMigration();
  startTokenRefresher();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ADgorhythms Event Suite running on port ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
