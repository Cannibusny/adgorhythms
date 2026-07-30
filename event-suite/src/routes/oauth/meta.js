const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { encrypt } = require('../../utils/encryption');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

const META_GRAPH_VERSION = 'v21.0';

function getRedirectUri(req) {
  if (process.env.META_REDIRECT_URI) {
    return process.env.META_REDIRECT_URI;
  }
  const baseUrl =
    process.env.BASE_URL ||
    `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/oauth/meta/callback`;
}

router.get('/connect', requireAuth, (req, res) => {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    console.error('META_APP_ID is not configured');
    return res.redirect('/dashboard?meta=error&reason=missing_config');
  }

  const state = crypto.randomBytes(16).toString('hex');
  req.session.metaOAuthState = state;

  const redirectUri = getRedirectUri(req);
  const scope = [
    'ads_management',
    'ads_read',
    'business_management',
    'pages_read_engagement',
    'instagram_basic',
  ].join(',');

  const authUrl =
    `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${state}` +
    '&response_type=code';

  req.session.save(() => res.redirect(authUrl));
});

router.get('/callback', requireAuth, async (req, res) => {
  const { code, error, error_description, state } = req.query;

  if (error) {
    console.error('Meta OAuth error:', error, error_description);
    return res.redirect(
      `/dashboard?meta=error&reason=${encodeURIComponent(error_description || error)}`
    );
  }

  if (!code) {
    return res.redirect('/dashboard?meta=error&reason=no_code');
  }

  if (req.session.metaOAuthState && state !== req.session.metaOAuthState) {
    console.error('Meta OAuth state mismatch');
    return res.redirect('/dashboard?meta=error&reason=state_mismatch');
  }
  delete req.session.metaOAuthState;

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    console.error('META_APP_ID or META_APP_SECRET not configured');
    return res.redirect('/dashboard?meta=error&reason=missing_config');
  }

  try {
    const redirectUri = getRedirectUri(req);

    const tokenResponse = await axios.get(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      }
    );

    const { access_token: shortLivedToken } = tokenResponse.data;

    const longLivedResponse = await axios.get(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    const { access_token: longLivedToken, expires_in } = longLivedResponse.data;
    const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000);

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
    const errData = err.response?.data?.error || err.response?.data || err.message;
    console.error('Meta OAuth callback error:', errData);
    const reason =
      typeof errData === 'object' ? errData.message || JSON.stringify(errData) : errData;
    res.redirect(
      `/dashboard?meta=error&reason=${encodeURIComponent(reason)}`
    );
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  await db.query(
    'DELETE FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'meta']
  );
  res.redirect(303, '/dashboard');
});

module.exports = router;
