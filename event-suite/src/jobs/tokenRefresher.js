const cron = require('node-cron');
const db = require('../db');
const { refreshMetaToken, refreshGoogleToken } = require('../utils/refreshTokens');

function startTokenRefresher() {
  // Run every day at 3 AM UTC
  cron.schedule('0 3 * * *', async () => {
    console.log('[TokenRefresher] Running token refresh job...');

    try {
      // Find tokens expiring in the next 7 days
      const result = await db.query(`
        SELECT id, platform, promoter_id FROM credentials
        WHERE token_expires_at < NOW() + INTERVAL '7 days'
        AND token_expires_at > NOW()
        AND status = 'active'
        AND (platform = 'meta' OR platform = 'google')
      `);

      console.log(`[TokenRefresher] Found ${result.rows.length} tokens to refresh`);

      for (const credential of result.rows) {
        try {
          if (credential.platform === 'meta') {
            await refreshMetaToken(credential.id);
          } else if (credential.platform === 'google') {
            await refreshGoogleToken(credential.id);
          }
        } catch (err) {
          console.error(
            `[TokenRefresher] Failed to refresh ${credential.platform} token ` +
            `for credential ${credential.id}:`,
            err.message
          );
          await db.query(
            "UPDATE credentials SET status = 'error' WHERE id = $1",
            [credential.id]
          );
        }
      }

      console.log('[TokenRefresher] Token refresh job complete');
    } catch (err) {
      console.error('[TokenRefresher] Job error:', err);
    }
  });

  console.log('[TokenRefresher] Scheduled daily at 03:00 UTC');
}

module.exports = { startTokenRefresher };
