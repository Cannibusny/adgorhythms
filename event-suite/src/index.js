require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const db = require('./db');
const { MIGRATION_SQL } = require('./db/schema');

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
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

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
  try {
    await db.query(MIGRATION_SQL);
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
