require('dotenv').config();

const db = require('../../src/db');
const { refreshMetaToken, refreshGoogleToken } = require('../../src/utils/refreshTokens');

module.exports = async (req, res) => {
  // Verify this is called by Vercel Cron (or with a valid secret)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[TokenRefresher] Running token refresh job...');

  try {
    const result = await db.query(`
      SELECT id, platform, promoter_id FROM credentials
      WHERE token_expires_at < NOW() + INTERVAL '7 days'
      AND token_expires_at > NOW()
      AND status = 'active'
      AND (platform = 'meta' OR platform = 'google')
    `);

    console.log(`[TokenRefresher] Found ${result.rows.length} tokens to refresh`);

    const results = [];
    for (const credential of result.rows) {
      try {
        if (credential.platform === 'meta') {
          await refreshMetaToken(credential.id);
        } else if (credential.platform === 'google') {
          await refreshGoogleToken(credential.id);
        }
        results.push({ id: credential.id, platform: credential.platform, status: 'refreshed' });
      } catch (err) {
        console.error(`[TokenRefresher] Failed: ${credential.id}`, err.message);
        await db.query(
          "UPDATE credentials SET status = 'error' WHERE id = $1",
          [credential.id]
        );
        results.push({ id: credential.id, platform: credential.platform, status: 'error', error: err.message });
      }
    }

    return res.json({ success: true, refreshed: results.length, results });
  } catch (err) {
    console.error('[TokenRefresher] Job error:', err);
    return res.status(500).json({ error: err.message });
  }
};
