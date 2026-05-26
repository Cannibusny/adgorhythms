const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendTicketEmail } = require('../utils/email');

const router = express.Router();

// ─── Event Creation Page ────────────────────────────────
router.get('/new', requireAuth, (_req, res) => {
  res.render('event-new', { promoter: { name: 'promoter' } });
});

router.post('/new', requireAuth, async (req, res) => {
  const promoterId = req.session.promoterId;
  const { name, description, date, time, location, ticketPrice, maxCapacity,
    tierNames, tierPrices, tierQuantities, tierDescriptions } = req.body;

  if (!name || !date || !time || !location || !maxCapacity) {
    return res.render('event-new', {
      promoter: { name: 'promoter' },
      error: 'All required fields must be filled out.',
      form: req.body,
    });
  }

  const eventDate = new Date(`${date}T${time}`);
  if (isNaN(eventDate.getTime())) {
    return res.render('event-new', {
      promoter: { name: 'promoter' },
      error: 'Invalid date or time.',
      form: req.body,
    });
  }

  const result = await db.query(
    `INSERT INTO events (promoter_id, name, description, event_date, location, ticket_price, max_capacity)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [promoterId, name, description || '', eventDate, location,
     parseFloat(ticketPrice) || 0, parseInt(maxCapacity, 10)]
  );

  const eventId = result.rows[0].id;

  // Insert ticket tiers if provided
  if (tierNames && Array.isArray(tierNames)) {
    for (let i = 0; i < tierNames.length; i++) {
      if (!tierNames[i]) continue;
      await db.query(
        `INSERT INTO ticket_tiers (event_id, name, price, quantity, description, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [eventId, tierNames[i], parseFloat(tierPrices[i]) || 0,
         parseInt(tierQuantities[i], 10) || 0, tierDescriptions ? tierDescriptions[i] || '' : '', i]
      );
    }
  }

  res.redirect(`/events/${eventId}/admin`);
});

// ─── Public Event Page ──────────────────────────────────
router.get('/:eventId', async (req, res) => {
  const { eventId } = req.params;

  const result = await db.query(
    `SELECT e.*, p.business_name, p.name as promoter_name,
       (SELECT COUNT(*) FROM tickets WHERE event_id = e.id AND status != 'cancelled') as tickets_sold
     FROM events e
     JOIN promoters p ON e.promoter_id = p.id
     WHERE e.id = $1`,
    [eventId]
  );

  if (result.rows.length === 0) {
    return res.status(404).send('Event not found');
  }

  const event = result.rows[0];

  // Fetch ticket tiers
  const tiersResult = await db.query(
    `SELECT tt.*,
       (SELECT COUNT(*) FROM tickets WHERE event_id = tt.event_id AND tier_name = tt.name AND status != 'cancelled') as sold
     FROM ticket_tiers tt WHERE tt.event_id = $1 ORDER BY tt.sort_order`,
    [eventId]
  );

  const tiers = tiersResult.rows.map(t => ({
    ...t,
    remaining: t.quantity - parseInt(t.sold, 10),
  }));

  const ticketsRemaining = event.max_capacity - parseInt(event.tickets_sold, 10);
  const flash = req.query;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';

  res.render('event-public', {
    event, ticketsRemaining, tiers, flash, promoter: null, stripePublishableKey,
  });
});

// ─── Validate Promo Code API ────────────────────────────
router.post('/:eventId/promo/validate', async (req, res) => {
  const { eventId } = req.params;
  const { code } = req.body;

  if (!code) return res.json({ valid: false, message: 'No code provided' });

  const result = await db.query(
    'SELECT * FROM promo_codes WHERE event_id = $1 AND UPPER(code) = UPPER($2) AND active = true',
    [eventId, code.trim()]
  );

  if (result.rows.length === 0) {
    return res.json({ valid: false, message: 'Invalid promo code' });
  }

  const promo = result.rows[0];
  if (promo.max_uses && promo.times_used >= promo.max_uses) {
    return res.json({ valid: false, message: 'Promo code has been fully redeemed' });
  }

  return res.json({
    valid: true,
    discountType: promo.discount_type,
    discountValue: parseFloat(promo.discount_value),
    code: promo.code,
  });
});

// ─── Create Stripe Checkout Session ─────────────────────
router.post('/:eventId/checkout', async (req, res) => {
  const { eventId } = req.params;
  const { buyerName, buyerEmail, buyerPhone, tierName, quantity, promoCode } = req.body;
  const qty = Math.max(1, Math.min(parseInt(quantity, 10) || 1, 10));

  if (!buyerName || !buyerEmail) {
    return res.redirect(`/events/${eventId}?error=Name+and+email+are+required`);
  }

  const eventResult = await db.query(
    `SELECT e.*, p.id as pid,
       (SELECT COUNT(*) FROM tickets WHERE event_id = e.id AND status != 'cancelled') as tickets_sold
     FROM events e JOIN promoters p ON e.promoter_id = p.id
     WHERE e.id = $1`,
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(404).send('Event not found');
  }

  const event = eventResult.rows[0];

  // Determine price from tier or fallback to event price
  let unitPrice = parseFloat(event.ticket_price);
  let resolvedTier = 'General';

  if (tierName) {
    const tierResult = await db.query(
      `SELECT tt.*,
         (SELECT COUNT(*) FROM tickets WHERE event_id = tt.event_id AND tier_name = tt.name AND status != 'cancelled') as sold
       FROM ticket_tiers tt WHERE tt.event_id = $1 AND tt.name = $2`,
      [eventId, tierName]
    );
    if (tierResult.rows.length > 0) {
      const tier = tierResult.rows[0];
      unitPrice = parseFloat(tier.price);
      resolvedTier = tier.name;
      const tierRemaining = tier.quantity - parseInt(tier.sold, 10);
      if (tierRemaining < qty) {
        return res.redirect(`/events/${eventId}?error=Not+enough+${encodeURIComponent(tier.name)}+tickets+available`);
      }
    }
  }

  // Check overall capacity
  const remaining = event.max_capacity - parseInt(event.tickets_sold, 10);
  if (remaining < qty) {
    return res.redirect(`/events/${eventId}?error=Not+enough+tickets+available`);
  }

  // Apply promo code
  let discount = 0;
  let appliedPromo = null;
  if (promoCode) {
    const promoResult = await db.query(
      'SELECT * FROM promo_codes WHERE event_id = $1 AND UPPER(code) = UPPER($2) AND active = true',
      [eventId, promoCode.trim()]
    );
    if (promoResult.rows.length > 0) {
      const promo = promoResult.rows[0];
      if (!promo.max_uses || promo.times_used < promo.max_uses) {
        appliedPromo = promo;
        if (promo.discount_type === 'percentage') {
          discount = unitPrice * (parseFloat(promo.discount_value) / 100);
        } else {
          discount = parseFloat(promo.discount_value);
        }
      }
    }
  }

  const finalPrice = Math.max(0, unitPrice - discount);

  // Try Stripe Checkout if configured and price > 0
  if (process.env.STRIPE_SECRET_KEY && finalPrice > 0) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: buyerEmail,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${event.name} — ${resolvedTier}`,
              description: `${resolvedTier} ticket for ${event.name}`,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: qty,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/events/${eventId}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/events/${eventId}?error=Payment+cancelled`,
        metadata: {
          eventId,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || '',
          tierName: resolvedTier,
          quantity: qty.toString(),
          promoCode: appliedPromo ? appliedPromo.code : '',
          discountAmount: discount.toFixed(2),
          unitPrice: finalPrice.toFixed(2),
        },
      });

      return res.redirect(session.url);
    } catch (err) {
      console.error('Stripe Checkout error:', err.message);
      return res.redirect(`/events/${eventId}?error=Payment+processing+error`);
    }
  }

  // Free ticket or Stripe not configured — create tickets directly
  const tickets = await createTickets(eventId, event, buyerName, buyerEmail, buyerPhone, qty, finalPrice, resolvedTier, appliedPromo, discount);

  res.redirect(`/events/${eventId}/ticket/${tickets[0].ticket_code}`);
});

// ─── Stripe Checkout Success ────────────────────────────
router.get('/:eventId/checkout/success', async (req, res) => {
  const { eventId } = req.params;
  const { session_id: sessionId } = req.query;

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return res.redirect(`/events/${eventId}?error=Invalid+session`);
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.redirect(`/events/${eventId}?error=Payment+not+completed`);
    }

    // Check if tickets already created for this session
    const existing = await db.query(
      'SELECT id FROM tickets WHERE stripe_session_id = $1 LIMIT 1',
      [sessionId]
    );

    if (existing.rows.length > 0) {
      const existingTicket = await db.query(
        'SELECT ticket_code FROM tickets WHERE stripe_session_id = $1 LIMIT 1',
        [sessionId]
      );
      return res.redirect(`/events/${eventId}/ticket/${existingTicket.rows[0].ticket_code}`);
    }

    const meta = session.metadata;
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

    const event = eventResult.rows[0];
    const qty = parseInt(meta.quantity, 10) || 1;
    const unitPrice = parseFloat(meta.unitPrice) || 0;
    const discountAmount = parseFloat(meta.discountAmount) || 0;

    let appliedPromo = null;
    if (meta.promoCode) {
      const promoResult = await db.query(
        'SELECT * FROM promo_codes WHERE event_id = $1 AND code = $2',
        [eventId, meta.promoCode]
      );
      if (promoResult.rows.length > 0) appliedPromo = promoResult.rows[0];
    }

    const tickets = await createTickets(
      eventId, event, meta.buyerName, meta.buyerEmail, meta.buyerPhone,
      qty, unitPrice, meta.tierName || 'General', appliedPromo, discountAmount,
      sessionId, session.payment_intent
    );

    res.redirect(`/events/${eventId}/ticket/${tickets[0].ticket_code}`);
  } catch (err) {
    console.error('Stripe success callback error:', err.message);
    res.redirect(`/events/${eventId}?error=Error+processing+payment+confirmation`);
  }
});

// ─── Stripe Webhook ─────────────────────────────────────
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('Stripe not configured');
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      // Tickets already created in success callback
      console.log('Stripe webhook confirmed payment:', session.id);
    }
  }

  res.json({ received: true });
});

// ─── Ticket Confirmation Page ───────────────────────────
router.get('/:eventId/ticket/:ticketCode', async (req, res) => {
  const { eventId, ticketCode } = req.params;

  const result = await db.query(
    `SELECT t.*, e.name as event_name, e.event_date, e.location, e.ticket_price,
       p.business_name
     FROM tickets t
     JOIN events e ON t.event_id = e.id
     JOIN promoters p ON e.promoter_id = p.id
     WHERE t.ticket_code = $1 AND e.id = $2`,
    [ticketCode, eventId]
  );

  if (result.rows.length === 0) {
    return res.status(404).send('Ticket not found');
  }

  const ticket = result.rows[0];
  res.render('ticket-confirmation', { ticket, promoter: null });
});

// ─── Check-In Page (Mobile-Friendly with QR Scanner) ────
router.get('/:eventId/checkin', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(404).send('Event not found or access denied');
  }

  res.render('event-checkin', { event: eventResult.rows[0], promoter: { name: 'promoter' } });
});

// ─── Check-In Verify API ────────────────────────────────
router.post('/:eventId/checkin/verify', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const { ticketCode, searchQuery } = req.body;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(403).json({ valid: false, message: 'Access denied' });
  }

  let ticket = null;

  if (ticketCode) {
    const result = await db.query(
      'SELECT * FROM tickets WHERE ticket_code = $1 AND event_id = $2',
      [ticketCode, eventId]
    );
    ticket = result.rows[0] || null;
  } else if (searchQuery) {
    const q = `%${searchQuery}%`;
    const result = await db.query(
      `SELECT * FROM tickets WHERE event_id = $1
       AND (LOWER(buyer_name) LIKE LOWER($2) OR LOWER(buyer_email) LIKE LOWER($2) OR ticket_code LIKE $2)
       AND status != 'cancelled'
       LIMIT 1`,
      [eventId, q]
    );
    ticket = result.rows[0] || null;
  }

  if (!ticket) {
    return res.json({ valid: false, message: 'Ticket not found — check the code or name' });
  }

  if (ticket.status === 'cancelled') {
    return res.json({ valid: false, message: 'Ticket was cancelled/refunded' });
  }

  if (ticket.status === 'checked_in') {
    return res.json({
      valid: false,
      message: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString()}`,
      buyer: ticket.buyer_name,
      tier: ticket.tier_name,
    });
  }

  // Check in
  await db.query(
    "UPDATE tickets SET status = 'checked_in', checked_in_at = NOW() WHERE id = $1",
    [ticket.id]
  );

  await db.query(
    'INSERT INTO check_ins (ticket_id, event_id, checked_in_by) VALUES ($1, $2, $3)',
    [ticket.id, eventId, promoterId]
  );

  return res.json({
    valid: true,
    message: 'Checked in!',
    buyer: ticket.buyer_name,
    email: ticket.buyer_email,
    tier: ticket.tier_name,
  });
});

// ─── Live Stats API ─────────────────────────────────────
router.get('/:eventId/stats', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT id, max_capacity FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(403).json({});

  const result = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status != 'cancelled') as total_sold,
       COUNT(*) FILTER (WHERE status = 'checked_in') as checked_in,
       COALESCE(SUM(amount_paid) FILTER (WHERE status != 'cancelled'), 0) as total_revenue,
       COUNT(*) FILTER (WHERE tier_name = 'VIP' AND status != 'cancelled') as vip_sold,
       COUNT(*) FILTER (WHERE tier_name = 'VIP' AND status = 'checked_in') as vip_checked_in,
       COUNT(*) FILTER (WHERE tier_name = 'General' AND status != 'cancelled') as general_sold,
       COUNT(*) FILTER (WHERE tier_name = 'General' AND status = 'checked_in') as general_checked_in,
       COUNT(*) FILTER (WHERE tier_name = 'Student' AND status != 'cancelled') as student_sold,
       COUNT(*) FILTER (WHERE tier_name = 'Student' AND status = 'checked_in') as student_checked_in
     FROM tickets WHERE event_id = $1`,
    [eventId]
  );

  res.json({
    ...result.rows[0],
    max_capacity: eventResult.rows[0].max_capacity,
  });
});

// ─── Recent Check-Ins API ───────────────────────────────
router.get('/:eventId/recent', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT id FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(403).json([]);

  const result = await db.query(
    `SELECT buyer_name, buyer_email, tier_name, checked_in_at
     FROM tickets WHERE event_id = $1 AND status = 'checked_in'
     ORDER BY checked_in_at DESC LIMIT 20`,
    [eventId]
  );
  res.json(result.rows);
});

// ─── Search Tickets API ─────────────────────────────────
router.get('/:eventId/search', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const { q } = req.query;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT id FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(403).json([]);

  const search = `%${q || ''}%`;
  const result = await db.query(
    `SELECT id, buyer_name, buyer_email, buyer_phone, tier_name, amount_paid, status, checked_in_at, ticket_code
     FROM tickets WHERE event_id = $1
     AND (LOWER(buyer_name) LIKE LOWER($2) OR LOWER(buyer_email) LIKE LOWER($2) OR ticket_code LIKE $2)
     ORDER BY buyer_name ASC LIMIT 50`,
    [eventId, search]
  );
  res.json(result.rows);
});

// ─── Live Dashboard ─────────────────────────────────────
router.get('/:eventId/live', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  res.render('event-live', { event: eventResult.rows[0], promoter: { name: 'promoter' } });
});

// ─── Admin Event Dashboard ──────────────────────────────
router.get('/:eventId/admin', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(404).send('Event not found or access denied');
  }

  const event = eventResult.rows[0];

  const ticketsResult = await db.query(
    `SELECT id, buyer_name, buyer_email, buyer_phone, ticket_code, amount_paid, status, checked_in_at, created_at, tier_name, promo_code
     FROM tickets WHERE event_id = $1 ORDER BY created_at DESC`,
    [eventId]
  );

  const tiersResult = await db.query(
    `SELECT tt.*, (SELECT COUNT(*) FROM tickets WHERE event_id = tt.event_id AND tier_name = tt.name AND status != 'cancelled') as sold
     FROM ticket_tiers tt WHERE tt.event_id = $1 ORDER BY tt.sort_order`,
    [eventId]
  );

  const promosResult = await db.query(
    'SELECT * FROM promo_codes WHERE event_id = $1 ORDER BY created_at DESC',
    [eventId]
  );

  const tickets = ticketsResult.rows;
  const totalSold = tickets.filter(t => t.status !== 'cancelled').length;
  const totalRevenue = tickets.filter(t => t.status !== 'cancelled').reduce((sum, t) => sum + parseFloat(t.amount_paid), 0);
  const checkedIn = tickets.filter(t => t.status === 'checked_in').length;
  const flash = req.query;

  res.render('event-admin', {
    event,
    tickets,
    tiers: tiersResult.rows,
    promos: promosResult.rows,
    totalSold,
    totalRevenue,
    checkedIn,
    flash,
    promoter: { name: 'promoter' },
  });
});

// ─── Add Promo Code ─────────────────────────────────────
router.post('/:eventId/admin/promo', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;
  const { code, discountType, discountValue, maxUses } = req.body;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  await db.query(
    `INSERT INTO promo_codes (event_id, code, discount_type, discount_value, max_uses)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (event_id, code) DO UPDATE SET
       discount_type = $3, discount_value = $4, max_uses = $5, active = true`,
    [eventId, code.toUpperCase(), discountType || 'percentage',
     parseFloat(discountValue) || 0, maxUses ? parseInt(maxUses, 10) : null]
  );

  res.redirect(`/events/${eventId}/admin?success=Promo+code+added`);
});

// ─── Add Ticket Tier ────────────────────────────────────
router.post('/:eventId/admin/tier', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;
  const { name, price, quantity, description } = req.body;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const sortResult = await db.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_sort FROM ticket_tiers WHERE event_id = $1',
    [eventId]
  );

  await db.query(
    `INSERT INTO ticket_tiers (event_id, name, price, quantity, description, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [eventId, name, parseFloat(price) || 0, parseInt(quantity, 10) || 0,
     description || '', sortResult.rows[0].next_sort]
  );

  res.redirect(`/events/${eventId}/admin?success=Tier+added`);
});

// ─── Refund / Cancel Ticket ─────────────────────────────
router.post('/:eventId/admin/refund/:ticketId', requireAuth, async (req, res) => {
  const { eventId, ticketId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(404).send('Event not found or access denied');
  }

  await db.query(
    "UPDATE tickets SET status = 'cancelled' WHERE id = $1 AND event_id = $2",
    [ticketId, eventId]
  );

  res.redirect(`/events/${eventId}/admin?refund=success`);
});

// ─── CSV Export ─────────────────────────────────────────
router.get('/:eventId/admin/export', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(404).send('Event not found or access denied');
  }

  const ticketsResult = await db.query(
    `SELECT buyer_name, buyer_email, buyer_phone, ticket_code, tier_name, amount_paid, status, checked_in_at, created_at, promo_code
     FROM tickets WHERE event_id = $1 ORDER BY created_at DESC`,
    [eventId]
  );

  const rows = ticketsResult.rows;
  const header = 'Name,Email,Phone,Ticket Code,Tier,Amount Paid,Status,Checked In At,Purchased At,Promo Code\n';
  const csv = header + rows.map(r =>
    `"${r.buyer_name}","${r.buyer_email}","${r.buyer_phone || ''}","${r.ticket_code}","${r.tier_name || 'General'}","${r.amount_paid}","${r.status}","${r.checked_in_at || ''}","${r.created_at}","${r.promo_code || ''}"`
  ).join('\n');

  const eventName = eventResult.rows[0].name.replace(/[^a-zA-Z0-9]/g, '_');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${eventName}_attendees.csv"`);
  res.send(csv);
});

// ─── My Events List ─────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const promoterId = req.session.promoterId;

  const eventsResult = await db.query(
    `SELECT e.*,
       (SELECT COUNT(*) FROM tickets WHERE event_id = e.id AND status != 'cancelled') as tickets_sold,
       (SELECT COALESCE(SUM(amount_paid), 0) FROM tickets WHERE event_id = e.id AND status != 'cancelled') as revenue
     FROM events e WHERE e.promoter_id = $1 ORDER BY e.event_date DESC`,
    [promoterId]
  );

  const promoterResult = await db.query(
    'SELECT name, email, business_name FROM promoters WHERE id = $1',
    [promoterId]
  );

  res.render('events-list', {
    events: eventsResult.rows,
    promoter: promoterResult.rows[0],
  });
});

// ─── Helper: Create tickets + send confirmation ─────────
async function createTickets(eventId, event, buyerName, buyerEmail, buyerPhone, qty, unitPrice, tierName, appliedPromo, discountAmount, stripeSessionId, stripePaymentIntent) {
  const tickets = [];

  for (let i = 0; i < qty; i++) {
    const ticketCode = crypto.randomBytes(16).toString('hex');
    const qrData = JSON.stringify({
      ticketCode,
      eventId,
      buyerName,
      buyerEmail,
    });
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    const ticketResult = await db.query(
      `INSERT INTO tickets (event_id, buyer_name, buyer_email, buyer_phone, ticket_code, qr_code, amount_paid, status, tier_name, stripe_session_id, stripe_payment_intent, promo_code, discount_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9, $10, $11, $12) RETURNING id, ticket_code`,
      [eventId, buyerName, buyerEmail, buyerPhone || null, ticketCode, qrDataUrl,
       unitPrice, tierName || 'General', stripeSessionId || null,
       stripePaymentIntent || null, appliedPromo ? appliedPromo.code : null,
       discountAmount || 0]
    );
    tickets.push(ticketResult.rows[0]);
  }

  // Increment promo code usage
  if (appliedPromo) {
    await db.query(
      'UPDATE promo_codes SET times_used = times_used + $1 WHERE id = $2',
      [qty, appliedPromo.id]
    );
  }

  // Send confirmation email
  try {
    await sendTicketEmail(event, buyerName, buyerEmail, tickets, tierName);
  } catch (err) {
    console.error('Failed to send ticket email:', err.message);
  }

  // Try Twilio SMS
  await sendTicketSMS(event, buyerName, buyerPhone, tickets);

  return tickets;
}

async function sendTicketSMS(event, buyerName, buyerPhone, tickets) {
  try {
    if (!buyerPhone) return;
    const { decrypt } = require('../utils/encryption');
    const twilioResult = await db.query(
      "SELECT api_key, account_id FROM credentials WHERE promoter_id = $1 AND platform = 'twilio' AND status = 'active'",
      [event.promoter_id]
    );

    if (twilioResult.rows.length > 0) {
      const { api_key: encryptedToken, account_id: accountInfo } = twilioResult.rows[0];
      const authToken = decrypt(encryptedToken);
      const parts = accountInfo.split('|');
      const accountSid = parts[0];
      const fromNumber = parts[1];

      if (fromNumber) {
        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);
        const eventDate = new Date(event.event_date);
        const dateStr = eventDate.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        });
        const timeStr = eventDate.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
        });

        await client.messages.create({
          body: `Your ticket for ${event.name} is confirmed! ${dateStr} at ${timeStr}, ${event.location}. Ticket code: ${tickets[0].ticket_code}`,
          from: fromNumber,
          to: buyerPhone,
        });
      }
    }
  } catch (err) {
    console.error('Failed to send ticket SMS:', err.message);
  }
}

module.exports = router;
