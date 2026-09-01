const express = require('express');
const axios = require('axios');
const { encrypt } = require('../../utils/encryption');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

const META_GRAPH_VERSION = 'v19.0';

// Multi-app support: App 1 (primary) and App 2 (secondary)
function getAppConfig(appIndex) {
  if (appIndex === 2) {
    return {
      appId: process.env.META_APP_ID_2 || '839208479236707',
      appSecret: process.env.META_APP_SECRET_2 || process.env.META_APP_SECRET,
      platform: 'meta_2',
    };
  }
  return {
    appId: process.env.META_APP_ID || '1716775929500494',
    appSecret: process.env.META_APP_SECRET,
    platform: 'meta',
  };
}

// Connect with App 1 (default)
router.get('/connect', requireAuth, (req, res) => {
  const appIndex = parseInt(req.query.app, 10) || 1;
  const config = getAppConfig(appIndex);
  const redirectUri = `${process.env.BASE_URL}/oauth/meta/callback`;
  const scope = 'ads_management,ads_read,business_management';
  const state = JSON.stringify({ app: appIndex });
  const authUrl =
    `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth` +
    `?client_id=${config.appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}` +
    '&response_type=code';
  res.redirect(authUrl);
});

// Also support /auth/meta/callback redirect
router.get('/callback', requireAuth, handleCallback);

async function handleCallback(req, res) {
  const { code, error, state } = req.query;
  if (error) {
    console.error('Meta OAuth error:', error);
    return res.redirect('/dashboard?meta=error');
  }

  let appIndex = 1;
  try {
    const parsed = JSON.parse(state || '{}');
    appIndex = parsed.app || 1;
  } catch (_e) { /* default to app 1 */ }

  const config = getAppConfig(appIndex);

  if (!config.appSecret) {
    console.error('Meta app secret not configured for app', appIndex);
    return res.redirect('/dashboard?meta=error');
  }

  try {
    const redirectUri = `${process.env.BASE_URL}/oauth/meta/callback`;
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: config.appId,
          client_secret: config.appSecret,
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
          client_id: config.appId,
          client_secret: config.appSecret,
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
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (promoter_id, platform)
       DO UPDATE SET access_token = $3, token_expires_at = $4, account_id = $5,
                     status = 'active', last_refreshed_at = NOW()`,
      [promoterId, config.platform, encryptedAccessToken, expiresAt, accountId]
    );

    res.redirect('/dashboard?meta=connected');
  } catch (err) {
    console.error('Meta OAuth callback error:', err.response?.data || err.message);
    res.redirect('/dashboard?meta=error');
  }
}

router.post('/disconnect', requireAuth, async (req, res) => {
  const platform = req.query.app === '2' ? 'meta_2' : 'meta';
  await db.query(
    'DELETE FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, platform]
  );
  res.redirect('/dashboard');
});

module.exports = router;
