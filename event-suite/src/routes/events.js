const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { decrypt } = require('../utils/encryption');

const router = express.Router();

// ─── Event Creation Page ────────────────────────────────
router.get('/new', requireAuth, (_req, res) => {
  res.render('event-new', { promoter: { name: 'promoter' } });
});

router.post('/new', requireAuth, async (req, res) => {
  const promoterId = req.session.promoterId;
  const { name, description, date, time, location, ticketPrice, maxCapacity } = req.body;

  if (!name || !date || !time || !location || !ticketPrice || !maxCapacity) {
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
    [promoterId, name, description || '', eventDate, location, parseFloat(ticketPrice), parseInt(maxCapacity, 10)]
  );

  res.redirect(`/events/${result.rows[0].id}/admin`);
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
  const ticketsRemaining = event.max_capacity - parseInt(event.tickets_sold, 10);
  const flash = req.query;

  res.render('event-public', { event, ticketsRemaining, flash, promoter: null });
});

// ─── Buy Ticket / Stripe Checkout ───────────────────────
router.post('/:eventId/checkout', async (req, res) => {
  const { eventId } = req.params;
  const { buyerName, buyerEmail, buyerPhone, quantity } = req.body;
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
  const remaining = event.max_capacity - parseInt(event.tickets_sold, 10);

  if (remaining < qty) {
    return res.redirect(`/events/${eventId}?error=Not+enough+tickets+available`);
  }

  // Check if promoter has Stripe connected (for future Checkout Session integration)
  // const stripeCredentials = await db.query(
  //   'SELECT access_token, account_id FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
  //   [event.promoter_id, 'stripe', 'active']
  // );
  // TODO: When Stripe is connected, create a Checkout Session instead of direct ticket creation
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
      `INSERT INTO tickets (event_id, buyer_name, buyer_email, buyer_phone, ticket_code, qr_code, amount_paid, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed') RETURNING id, ticket_code`,
      [eventId, buyerName, buyerEmail, buyerPhone || null, ticketCode, qrDataUrl, event.ticket_price]
    );
    tickets.push(ticketResult.rows[0]);
  }

  // Try to send confirmation via Twilio if connected
  await sendTicketConfirmation(event, buyerName, buyerEmail, buyerPhone, tickets);

  res.redirect(`/events/${eventId}/ticket/${tickets[0].ticket_code}`);
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

// ─── Check-In Page (Mobile-Friendly) ────────────────────
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

// ─── Check-In API ────────────────────────────────────────
router.post('/:eventId/checkin/verify', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const { ticketCode } = req.body;
  const promoterId = req.session.promoterId;

  // Verify event ownership
  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(403).json({ valid: false, message: 'Access denied' });
  }

  // Find ticket
  const ticketResult = await db.query(
    'SELECT * FROM tickets WHERE ticket_code = $1 AND event_id = $2',
    [ticketCode, eventId]
  );

  if (ticketResult.rows.length === 0) {
    return res.json({ valid: false, message: 'Invalid ticket — not found' });
  }

  const ticket = ticketResult.rows[0];

  if (ticket.status === 'cancelled') {
    return res.json({ valid: false, message: 'Ticket was cancelled/refunded' });
  }

  if (ticket.status === 'checked_in') {
    return res.json({
      valid: false,
      message: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString()}`,
    });
  }

  // Check in
  await db.query(
    'UPDATE tickets SET status = \'checked_in\', checked_in_at = NOW() WHERE id = $1',
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
  });
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
    `SELECT id, buyer_name, buyer_email, buyer_phone, ticket_code, amount_paid, status, checked_in_at, created_at
     FROM tickets WHERE event_id = $1 ORDER BY created_at DESC`,
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
    totalSold,
    totalRevenue,
    checkedIn,
    flash,
    promoter: { name: 'promoter' },
  });
});

// ─── Refund / Cancel Ticket ─────────────────────────────
router.post('/:eventId/admin/refund/:ticketId', requireAuth, async (req, res) => {
  const { eventId, ticketId } = req.params;
  const promoterId = req.session.promoterId;

  // Verify event ownership
  const eventResult = await db.query(
    'SELECT * FROM events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );

  if (eventResult.rows.length === 0) {
    return res.status(404).send('Event not found or access denied');
  }

  await db.query(
    'UPDATE tickets SET status = \'cancelled\' WHERE id = $1 AND event_id = $2',
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
    `SELECT buyer_name, buyer_email, buyer_phone, ticket_code, amount_paid, status, checked_in_at, created_at
     FROM tickets WHERE event_id = $1 ORDER BY created_at DESC`,
    [eventId]
  );

  const rows = ticketsResult.rows;
  const header = 'Name,Email,Phone,Ticket Code,Amount Paid,Status,Checked In At,Purchased At\n';
  const csv = header + rows.map(r =>
    `"${r.buyer_name}","${r.buyer_email}","${r.buyer_phone || ''}","${r.ticket_code}","${r.amount_paid}","${r.status}","${r.checked_in_at || ''}","${r.created_at}"`
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

// ─── Helper: Send ticket confirmation ───────────────────
async function sendTicketConfirmation(event, buyerName, buyerEmail, buyerPhone, tickets) {
  try {
    // Try Twilio SMS if connected and buyer has phone
    if (buyerPhone) {
      const twilioResult = await db.query(
        'SELECT api_key, account_id FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
        [event.promoter_id, 'twilio', 'active']
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
    }
  } catch (err) {
    console.error('Failed to send ticket confirmation:', err.message);
  }
}

module.exports = router;
