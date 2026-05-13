const db = require('../../db');
const { decrypt } = require('../encryption');

async function getStripeClient(promoterId) {
  const result = await db.query(
    'SELECT access_token, account_id FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
    [promoterId, 'stripe', 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Stripe not connected for this promoter');
  }

  const accessToken = decrypt(result.rows[0].access_token);
  const accountId = result.rows[0].account_id;

  const stripe = require('stripe')(accessToken);
  return { stripe, accountId };
}

async function createPaymentIntent(promoterId, amount, currency = 'usd', metadata = {}) {
  const { stripe, accountId } = await getStripeClient(promoterId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  }, {
    stripeAccount: accountId,
  });

  console.log(`Stripe PaymentIntent created: ${paymentIntent.id}`);
  return paymentIntent;
}

module.exports = { getStripeClient, createPaymentIntent };
