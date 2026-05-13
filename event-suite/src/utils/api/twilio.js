const db = require('../../db');
const { decrypt } = require('../encryption');

async function getTwilioClient(promoterId) {
  const result = await db.query(
    'SELECT account_id, api_key FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
    [promoterId, 'twilio', 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Twilio not connected for this promoter');
  }

  const { account_id: accountData, api_key: encryptedAuthToken } = result.rows[0];
  const authToken = decrypt(encryptedAuthToken);

  // account_id may be "SID|phoneNumber" or just "SID"
  const parts = accountData.split('|');
  const accountSid = parts[0];
  const phoneNumber = parts[1] || null;

  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);

  return { client, phoneNumber };
}

async function sendSMS(promoterId, to, message) {
  const { client, phoneNumber } = await getTwilioClient(promoterId);
  const from = phoneNumber || process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error('No Twilio phone number configured');
  }

  const result = await client.messages.create({
    body: message,
    from,
    to,
  });

  console.log(`SMS sent to ${to} (SID: ${result.sid})`);
  return result;
}

module.exports = { sendSMS, getTwilioClient };
