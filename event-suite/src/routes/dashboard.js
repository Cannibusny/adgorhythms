const express = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const PLATFORMS = [
  { key: 'meta', label: 'Meta Ads (Facebook / Instagram)', connectUrl: '/oauth/meta/connect', type: 'oauth' },
  { key: 'google', label: 'Google Ads', connectUrl: '/oauth/google/connect', type: 'oauth' },
  { key: 'stripe', label: 'Stripe', connectUrl: '/oauth/stripe/connect', type: 'oauth' },
  { key: 'twilio', label: 'Twilio (SMS)', connectUrl: '/settings/twilio', type: 'api_key' },
  { key: 'klaviyo', label: 'Klaviyo (Email)', connectUrl: '/settings/klaviyo', type: 'api_key' },
];

router.get('/dashboard', requireAuth, async (req, res) => {
  const promoterId = req.session.promoterId;

  const [credentialsResult, promoterResult] = await Promise.all([
    db.query(
      'SELECT platform, status, last_refreshed_at, token_expires_at, account_id FROM credentials WHERE promoter_id = $1',
      [promoterId]
    ),
    db.query('SELECT name, email, business_name FROM promoters WHERE id = $1', [promoterId]),
  ]);

  const credMap = {};
  credentialsResult.rows.forEach((cred) => {
    credMap[cred.platform] = cred;
  });

  const platforms = PLATFORMS.map((p) => {
    const cred = credMap[p.key] || null;
    return {
      ...p,
      status: cred ? cred.status : 'inactive',
      statusText: cred
        ? cred.status === 'active' ? 'Connected' : cred.status === 'error' ? 'Error — Reconnect' : 'Expired'
        : 'Not Connected',
      lastRefreshed: cred?.last_refreshed_at || null,
      expiresAt: cred?.token_expires_at || null,
      accountId: cred?.account_id || null,
    };
  });

  const promoter = promoterResult.rows[0];
  const flash = req.query;

  res.render('dashboard', { platforms, promoter, flash });
});

module.exports = router;
