const express = require('express');
const axios = require('axios');
const { encrypt } = require('../../utils/encryption');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

router.get('/settings', requireAuth, async (req, res) => {
  const result = await db.query(
    'SELECT status FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'klaviyo']
  );
  const credential = result.rows[0] || null;
  res.render('klaviyo-settings', { credential, error: null, success: null });
});

router.post('/save', requireAuth, async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.render('klaviyo-settings', {
      credential: null,
      error: 'API Key is required',
      success: null,
    });
  }

  try {
    // Validate the API key by making a test request
    await axios.get('https://a.klaviyo.com/api/accounts/', {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: '2024-02-15',
      },
    });

    const promoterId = req.session.promoterId;
    const encryptedApiKey = encrypt(apiKey);

    await db.query(
      `INSERT INTO credentials (promoter_id, platform, api_key, status)
       VALUES ($1, 'klaviyo', $2, 'active')
       ON CONFLICT (promoter_id, platform)
       DO UPDATE SET api_key = $2, status = 'active', last_refreshed_at = NOW()`,
      [promoterId, encryptedApiKey]
    );

    res.redirect('/dashboard?klaviyo=connected');
  } catch (err) {
    if (err.response && err.response.status === 401) {
      return res.render('klaviyo-settings', {
        credential: null,
        error: 'Invalid API key. Please check and try again.',
        success: null,
      });
    }
    // If validation fails for network reasons, still save (they may be offline)
    const promoterId = req.session.promoterId;
    const encryptedApiKey = encrypt(apiKey);
    await db.query(
      `INSERT INTO credentials (promoter_id, platform, api_key, status)
       VALUES ($1, 'klaviyo', $2, 'active')
       ON CONFLICT (promoter_id, platform)
       DO UPDATE SET api_key = $2, status = 'active', last_refreshed_at = NOW()`,
      [promoterId, encryptedApiKey]
    );
    res.redirect('/dashboard?klaviyo=connected');
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  await db.query(
    'DELETE FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'klaviyo']
  );
  res.redirect('/dashboard');
});

module.exports = router;
