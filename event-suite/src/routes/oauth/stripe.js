const express = require('express');
const axios = require('axios');
const { encrypt } = require('../../utils/encryption');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

router.get('/connect', requireAuth, (req, res) => {
  const url =
    'https://connect.stripe.com/oauth/authorize' +
    '?response_type=code' +
    `&client_id=${process.env.STRIPE_CLIENT_ID}` +
    '&scope=read_write' +
    `&redirect_uri=${encodeURIComponent(process.env.BASE_URL + '/oauth/stripe/callback')}`;
  res.redirect(url);
});

router.get('/callback', requireAuth, async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    console.error('Stripe OAuth error:', error);
    return res.redirect('/dashboard?stripe=error');
  }

  try {
    const response = await axios.post(
      'https://connect.stripe.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_secret: process.env.STRIPE_SECRET_KEY,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, stripe_user_id, refresh_token } = response.data;

    const promoterId = req.session.promoterId;
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

    await db.query(
      `INSERT INTO credentials (promoter_id, platform, access_token, refresh_token, account_id, status)
       VALUES ($1, 'stripe', $2, $3, $4, 'active')
       ON CONFLICT (promoter_id, platform)
       DO UPDATE SET access_token = $2, refresh_token = COALESCE($3, credentials.refresh_token),
                     account_id = $4, status = 'active', last_refreshed_at = NOW()`,
      [promoterId, encryptedAccessToken, encryptedRefreshToken, stripe_user_id]
    );

    res.redirect('/dashboard?stripe=connected');
  } catch (err) {
    console.error('Stripe OAuth callback error:', err.response?.data || err.message);
    res.redirect('/dashboard?stripe=error');
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  await db.query(
    'DELETE FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'stripe']
  );
  res.redirect('/dashboard');
});

module.exports = router;
