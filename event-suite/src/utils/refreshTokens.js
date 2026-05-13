const axios = require('axios');
const { google } = require('googleapis');
const { decrypt, encrypt } = require('./encryption');
const db = require('../db');

const META_GRAPH_VERSION = 'v19.0';

async function refreshMetaToken(credentialId) {
  const result = await db.query('SELECT * FROM credentials WHERE id = $1', [credentialId]);
  const credential = result.rows[0];
  const accessToken = decrypt(credential.access_token);

  // Meta long-lived tokens are refreshed by exchanging them
  const response = await axios.get(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`,
    {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: accessToken,
      },
    }
  );

  const newAccessToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 5184000;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const encryptedAccessToken = encrypt(newAccessToken);
  await db.query(
    `UPDATE credentials
     SET access_token = $1, token_expires_at = $2, last_refreshed_at = NOW(), status = 'active'
     WHERE id = $3`,
    [encryptedAccessToken, expiresAt, credentialId]
  );

  console.log(`Meta token refreshed for credential ${credentialId}`);
}

async function refreshGoogleToken(credentialId) {
  const result = await db.query('SELECT * FROM credentials WHERE id = $1', [credentialId]);
  const credential = result.rows[0];
  const refreshToken = decrypt(credential.refresh_token);

  if (!refreshToken) {
    throw new Error('No refresh token available for Google credential');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials: tokens } = await oauth2Client.refreshAccessToken();
  const encryptedAccessToken = encrypt(tokens.access_token);
  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  await db.query(
    `UPDATE credentials
     SET access_token = $1, token_expires_at = $2, last_refreshed_at = NOW(), status = 'active'
     WHERE id = $3`,
    [encryptedAccessToken, expiresAt, credentialId]
  );

  console.log(`Google token refreshed for credential ${credentialId}`);
}

module.exports = { refreshMetaToken, refreshGoogleToken };
