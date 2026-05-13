const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

// Health check (public)
router.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      db_configured: !!process.env.DATABASE_URL,
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      db_configured: !!process.env.DATABASE_URL,
      node_env: process.env.NODE_ENV || 'not set',
    });
  }
});

// Get all credential statuses for the logged-in promoter
router.get('/credentials', requireAuth, async (req, res) => {
  const result = await db.query(
    `SELECT platform, status, token_expires_at, last_refreshed_at, account_id, created_at
     FROM credentials WHERE promoter_id = $1
     ORDER BY platform`,
    [req.session.promoterId]
  );
  res.json({ credentials: result.rows });
});

// Test a specific platform connection
router.post('/test/:platform', requireAuth, async (req, res) => {
  const { platform } = req.params;
  const promoterId = req.session.promoterId;

  try {
    const result = await db.query(
      'SELECT status FROM credentials WHERE promoter_id = $1 AND platform = $2',
      [promoterId, platform]
    );

    if (result.rows.length === 0) {
      return res.json({ connected: false, message: `${platform} is not connected` });
    }

    if (result.rows[0].status !== 'active') {
      return res.json({ connected: false, message: `${platform} connection has status: ${result.rows[0].status}` });
    }

    res.json({ connected: true, message: `${platform} is connected and active` });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

module.exports = router;
