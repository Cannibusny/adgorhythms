const axios = require('axios');
const db = require('../../db');
const { decrypt } = require('../encryption');

async function getKlaviyoClient(promoterId) {
  const result = await db.query(
    'SELECT api_key FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
    [promoterId, 'klaviyo', 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Klaviyo not connected for this promoter');
  }

  const apiKey = decrypt(result.rows[0].api_key);
  return apiKey;
}

async function sendKlaviyoEvent(promoterId, eventData) {
  const apiKey = await getKlaviyoClient(promoterId);

  const response = await axios.post(
    'https://a.klaviyo.com/api/events/',
    {
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: eventData.eventName } } },
          profile: { data: { type: 'profile', attributes: { email: eventData.email } } },
          properties: eventData.properties || {},
        },
      },
    },
    {
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/json',
        revision: '2024-02-15',
      },
    }
  );

  console.log(`Klaviyo event "${eventData.eventName}" sent for ${eventData.email}`);
  return response.data;
}

module.exports = { sendKlaviyoEvent, getKlaviyoClient };
