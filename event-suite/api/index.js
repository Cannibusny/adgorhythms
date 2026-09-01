require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const db = require('../src/db');
const { MIGRATION_SQL } = require('../src/db/schema');

// Routes
const authRoutes = require('../src/routes/auth');
const dashboardRoutes = require('../src/routes/dashboard');
const metaOAuthRoutes = require('../src/routes/oauth/meta');
const googleOAuthRoutes = require('../src/routes/oauth/google');
const stripeOAuthRoutes = require('../src/routes/oauth/stripe');
const twilioRoutes = require('../src/routes/api/twilio');
const klaviyoRoutes = require('../src/routes/api/klaviyo');
const statusRoutes = require('../src/routes/api/status');
const eventRoutes = require('../src/routes/events');
const checkinRoutes = require('../src/routes/checkin');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'src', 'views'));

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Stripe webhook MUST be before express.json() to preserve raw body for signature verification
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('Stripe not configured');
  }
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      console.log('Stripe webhook confirmed payment:', session.id);
    }
  }
  res.json({ received: true });
});

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
app.use('/events', eventRoutes);
app.use('/checkin', checkinRoutes);

// Support /auth/meta/callback redirect
app.get('/auth/meta/callback', (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  res.redirect(`/oauth/meta/callback${qs ? '?' + qs : ''}`);
});

// Static files for PWA
app.use(express.static(path.join(__dirname, '..', 'src', 'public')));

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
      await db.query(MIGRATION_SQL);
      migrated = true;
    } catch (err) {
      console.error('Migration error:', err.message);
      migrated = true;
    }
  }
  return originalHandler(req, res);
};
