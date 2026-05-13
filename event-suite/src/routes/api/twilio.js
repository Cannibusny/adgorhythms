const express = require('express');
const { encrypt } = require('../../utils/encryption');
const { requireAuth } = require('../../middleware/auth');
const db = require('../../db');

const router = express.Router();

router.get('/settings', requireAuth, async (req, res) => {
  const result = await db.query(
    'SELECT account_id, status FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'twilio']
  );
  const credential = result.rows[0] || null;
  res.render('twilio-settings', { credential, error: null, success: null });
});

router.post('/save', requireAuth, async (req, res) => {
  const { accountSid, authToken, phoneNumber } = req.body;

  if (!accountSid || !authToken) {
    return res.render('twilio-settings', {
      credential: null,
      error: 'Account SID and Auth Token are required',
      success: null,
    });
  }

  try {
    const promoterId = req.session.promoterId;
    const encryptedAuthToken = encrypt(authToken);
    const accountData = phoneNumber ? `${accountSid}|${phoneNumber}` : accountSid;

    await db.query(
      `INSERT INTO credentials (promoter_id, platform, api_key, account_id, status)
       VALUES ($1, 'twilio', $2, $3, 'active')
       ON CONFLICT (promoter_id, platform)
       DO UPDATE SET api_key = $2, account_id = $3, status = 'active', last_refreshed_at = NOW()`,
      [promoterId, encryptedAuthToken, accountData]
    );

    res.redirect('/dashboard?twilio=connected');
  } catch (err) {
    console.error('Twilio save error:', err);
    res.render('twilio-settings', {
      credential: null,
      error: 'Failed to save credentials',
      success: null,
    });
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  await db.query(
    'DELETE FROM credentials WHERE promoter_id = $1 AND platform = $2',
    [req.session.promoterId, 'twilio']
  );
  res.redirect('/dashboard');
});

module.exports = router;
