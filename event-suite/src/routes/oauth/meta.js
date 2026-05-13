const express = require('express');
const axios = require('axios');
const { encrypt } = require('../../utils/encryption');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

const META_GRAPH_VERSION = 'v19.0';

router.get('/connect', requireAuth, (req, res) => {
  const redirectUri = `${process.env.BASE_URL}/oauth/meta/callback`;
  const scope = 'ads_management,ads_read,business_management';
  const authUrl =
    `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth` +
    `?client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    '&response_type=code';
  res.redirect(authUrl);
});

router.get('/callback', requireAuth, async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    console.error('Meta OAuth error:', error);
    return res.redirect('/dashboard?meta=error');
  }

  try {
    const redirectUri = `${process.env.BASE_URL}/oauth/meta/callback`;
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: redirectUri,
          code,
        },
      }
    );

    const { access_token: shortLivedToken } = tokenResponse.data;

    // Exchange for long-lived token (60 days)
    const longLivedResponse = await axios.get(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    const { access_token: longLivedToken, expires_in } = longLivedResponse.data;
    const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000);

    // Fetch ad accounts
    let accountId = null;
    try {
      const accountsResponse = await axios.get(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts`,
        { params: { access_token: longLivedToken, limit: 1 } }
      );
      if (accountsResponse.data.data && accountsResponse.data.data.length > 0) {
        accountId = accountsResponse.data.data[0].id;
      }
    } catch (accountErr) {
      console.warn('Could not fetch Meta ad accounts:', accountErr.message);
    }

    const promoterId = req.session.promoterId;
    const encryptedAccessToken = encrypt(longLivedToken);

    await db.query(
      `INSERT INTO credentials (promoter_id, platform, access_token, token_expires_at, account_id, status)
       VALUES ($1, 'meta', $2, $3, $4, 'active')
       ON CONFLICT (promoter_id, platform)
       DO UPDATE SET access_token = $2, token_expires_at = $3, account_id = $4,
                     status = 'active', last_refreshed_at = NOW()`,
      [promoterId, encryptedAccessToken, expiresAt, accountId]
    );

    res.redirect('/dashboard?meta=connected');
  } catch (err) {
    console.error('Meta OAuth callback error:', err.response?.data || err.message);
    res.redirect('/dashboard?meta=error');
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  await db.query(
    'DELETE FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'meta']
  );
  res.redirect('/dashboard');
});

module.exports = router;
