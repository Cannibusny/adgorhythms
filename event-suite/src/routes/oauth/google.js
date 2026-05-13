const express = require('express');
const { google } = require('googleapis');
const { encrypt } = require('../../utils/encryption');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/oauth/google/callback`
  );
}

router.get('/connect', requireAuth, (req, res) => {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/adwords'],
  });
  res.redirect(authUrl);
});

router.get('/callback', requireAuth, async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect('/dashboard?google=error');
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const promoterId = req.session.promoterId;
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    await db.query(
      `INSERT INTO credentials (promoter_id, platform, access_token, refresh_token, token_expires_at, status)
       VALUES ($1, 'google', $2, $3, $4, 'active')
       ON CONFLICT (promoter_id, platform)
       DO UPDATE SET access_token = $2,
                     refresh_token = COALESCE($3, credentials.refresh_token),
                     token_expires_at = $4,
                     status = 'active', last_refreshed_at = NOW()`,
      [promoterId, encryptedAccessToken, encryptedRefreshToken, expiresAt]
    );

    res.redirect('/dashboard?google=connected');
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    res.redirect('/dashboard?google=error');
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  await db.query(
    'DELETE FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'google']
  );
  res.redirect('/dashboard');
});

module.exports = router;
