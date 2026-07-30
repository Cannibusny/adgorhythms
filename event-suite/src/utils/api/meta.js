const axios = require('axios');
const db = require('../../db');
const { decrypt } = require('../encryption');

const META_GRAPH_VERSION = 'v21.0';

async function getMetaCredentials(promoterId) {
  const result = await db.query(
    'SELECT access_token, account_id FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
    [promoterId, 'meta', 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Meta Ads not connected for this promoter');
  }

  const { access_token: encryptedToken, account_id: adAccountId } = result.rows[0];
  return {
    accessToken: decrypt(encryptedToken),
    adAccountId,
  };
}

async function createAdCampaign(promoterId, campaignData) {
  const { accessToken, adAccountId } = await getMetaCredentials(promoterId);

  const response = await axios.post(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${adAccountId}/campaigns`,
    {
      name: campaignData.name,
      objective: campaignData.objective || 'OUTCOME_AWARENESS',
      status: 'PAUSED',
      special_ad_categories: campaignData.specialAdCategories || [],
      access_token: accessToken,
    }
  );

  console.log(`Meta campaign created: ${response.data.id}`);
  return response.data;
}

async function getAdAccounts(promoterId) {
  const { accessToken } = await getMetaCredentials(promoterId);

  const response = await axios.get(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts`,
    {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_status,currency',
      },
    }
  );

  return response.data.data;
}

module.exports = { createAdCampaign, getAdAccounts, getMetaCredentials };
