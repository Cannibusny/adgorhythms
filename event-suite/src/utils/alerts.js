const db = require('../db');

async function alertPromoter(promoterId, message) {
  try {
    const result = await db.query('SELECT phone FROM promoters WHERE id = $1', [promoterId]);
    if (result.rows.length === 0 || !result.rows[0].phone) {
      console.warn(`Cannot alert promoter ${promoterId}: no phone number on file`);
      return;
    }

    // Lazy-require to avoid circular dependency
    const { sendSMS } = require('./api/twilio');
    const phone = result.rows[0].phone;

    await sendSMS(promoterId, phone, `[ADgorhythms Alert] ${message}`);
    console.log(`Alert sent to promoter ${promoterId}: ${message}`);
  } catch (err) {
    console.error(`Failed to alert promoter ${promoterId}:`, err.message);
  }
}

module.exports = { alertPromoter };
