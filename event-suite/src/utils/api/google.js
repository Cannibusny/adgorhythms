const { google } = require('googleapis');
const db = require('../../db');
const { decrypt } = require('../encryption');

async function getGoogleAdsClient(promoterId) {
  const result = await db.query(
    'SELECT access_token, refresh_token FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
    [promoterId, 'google', 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Google Ads not connected for this promoter');
  }

  const accessToken = decrypt(result.rows[0].access_token);
  const refreshToken = result.rows[0].refresh_token ? decrypt(result.rows[0].refresh_token) : null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

module.exports = { getGoogleAdsClient };
