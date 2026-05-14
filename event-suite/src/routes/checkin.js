const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const QRCode = require('qrcode');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { decrypt } = require('../utils/encryption');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Checkin Events List ────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const promoterId = req.session.promoterId;
  const result = await db.query(
    `SELECT ce.*,
       (SELECT COUNT(*) FROM attendees WHERE checkin_event_id = ce.id) as total_attendees,
       (SELECT COUNT(*) FROM attendees WHERE checkin_event_id = ce.id AND checked_in = true) as checked_in_count
     FROM checkin_events ce WHERE ce.promoter_id = $1 ORDER BY ce.event_date DESC`,
    [promoterId]
  );
  const promoterResult = await db.query(
    'SELECT name, email, business_name FROM promoters WHERE id = $1',
    [promoterId]
  );
  res.render('checkin-events-list', { events: result.rows, promoter: promoterResult.rows[0] });
});

// ─── Create Checkin Event ───────────────────────────────
router.get('/new', requireAuth, (_req, res) => {
  res.render('checkin-event-new', { promoter: { name: 'promoter' } });
});

router.post('/new', requireAuth, async (req, res) => {
  const promoterId = req.session.promoterId;
  const { name, description, date, time, location, city, region, currency } = req.body;

  // Package arrays from form (qs parser with extended:true strips brackets)
  const pkgNames = req.body.pkg_name || req.body['pkg_name[]'] || [];
  const pkgPrices = req.body.pkg_price || req.body['pkg_price[]'] || [];
  const pkgDescs = req.body.pkg_desc || req.body['pkg_desc[]'] || [];
  const pkgTiers = req.body.pkg_tier || req.body['pkg_tier[]'] || [];

  if (!name || !date || !time || !location) {
    return res.render('checkin-event-new', {
      promoter: { name: 'promoter' },
      error: 'Name, date, time, and location are required.',
      form: req.body,
    });
  }

  const eventDate = new Date(`${date}T${time}`);
  const result = await db.query(
    `INSERT INTO checkin_events (promoter_id, name, description, event_date, location, city, region, currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [promoterId, name, description || '', eventDate, location, city || '', region || 'NYC', currency || 'USD']
  );
  const eventId = result.rows[0].id;

  // Create packages
  const names = Array.isArray(pkgNames) ? pkgNames : [pkgNames];
  const prices = Array.isArray(pkgPrices) ? pkgPrices : [pkgPrices];
  const descs = Array.isArray(pkgDescs) ? pkgDescs : [pkgDescs];
  const tiers = Array.isArray(pkgTiers) ? pkgTiers : [pkgTiers];

  for (let i = 0; i < names.length; i++) {
    if (names[i] && prices[i]) {
      await db.query(
        `INSERT INTO event_packages (event_id, tier, name, price, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [eventId, tiers[i] || 'Gold', names[i], parseFloat(prices[i]) || 0, descs[i] || '']
      );
    }
  }

  res.redirect(`/checkin/${eventId}/admin`);
});

// ─── Registrations View ─────────────────────────────────
router.get('/:eventId/registrations', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const registrations = await db.query(
    'SELECT * FROM guest_registrations WHERE event_id = $1 ORDER BY created_at DESC',
    [eventId]
  );

  const promoterResult = await db.query('SELECT name FROM promoters WHERE id = $1', [promoterId]);

  res.render('event-registrations', {
    event: eventResult.rows[0],
    registrations: registrations.rows,
    promoter: promoterResult.rows[0],
  });
});

// ─── Export Registrations CSV ────────────────────────────
router.get('/:eventId/registrations/export', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const registrations = await db.query(
    'SELECT * FROM guest_registrations WHERE event_id = $1 ORDER BY created_at DESC',
    [eventId]
  );

  const rows = registrations.rows;
  const csvHeader = 'Full Name,Phone,Email,Group Size,Package,Notes,Registered At\n';
  const csvBody = rows.map(r =>
    `"${r.full_name}","${r.phone}","${r.email}",${r.group_size},"${r.package_name || ''}","${(r.notes || '').replace(/"/g, '""')}","${new Date(r.created_at).toISOString()}"`
  ).join('\n');

  const filename = `${eventResult.rows[0].name.replace(/[^a-z0-9]/gi, '-')}-registrations.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvHeader + csvBody);
});

// ─── QR Code Page ────────────────────────────────────────
router.get('/:eventId/qr', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const registrationUrl = `${baseUrl}/e/${eventId}`;
  const qrDataUrl = await QRCode.toDataURL(registrationUrl, { width: 400, margin: 2 });

  const promoterResult = await db.query('SELECT name FROM promoters WHERE id = $1', [promoterId]);

  res.render('event-qr', {
    event: eventResult.rows[0],
    qrDataUrl,
    registrationUrl,
    promoter: promoterResult.rows[0],
  });
});

// ─── Edit Event ──────────────────────────────────────────
router.get('/:eventId/edit', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const packagesResult = await db.query(
    'SELECT * FROM event_packages WHERE event_id = $1 ORDER BY tier, price ASC',
    [eventId]
  );

  const promoterResult = await db.query('SELECT name FROM promoters WHERE id = $1', [promoterId]);

  res.render('checkin-event-edit', {
    event: eventResult.rows[0],
    packages: packagesResult.rows,
    promoter: promoterResult.rows[0],
    error: null,
  });
});

router.post('/:eventId/edit', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;
  const { name, description, date, time, location, city, region, currency } = req.body;

  // Package arrays
  const pkgNames = req.body.pkg_name || req.body['pkg_name[]'] || [];
  const pkgPrices = req.body.pkg_price || req.body['pkg_price[]'] || [];
  const pkgDescs = req.body.pkg_desc || req.body['pkg_desc[]'] || [];
  const pkgTiers = req.body.pkg_tier || req.body['pkg_tier[]'] || [];

  if (!name || !date || !time || !location) {
    const eventResult = await db.query(
      'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
      [eventId, promoterId]
    );
    const packagesResult = await db.query(
      'SELECT * FROM event_packages WHERE event_id = $1 ORDER BY tier, price ASC',
      [eventId]
    );
    const promoterResult = await db.query('SELECT name FROM promoters WHERE id = $1', [promoterId]);
    return res.render('checkin-event-edit', {
      event: eventResult.rows[0],
      packages: packagesResult.rows,
      promoter: promoterResult.rows[0],
      error: 'Name, date, time, and location are required.',
    });
  }

  const eventDate = new Date(`${date}T${time}`);

  // Update event details
  await db.query(
    `UPDATE checkin_events SET name = $1, description = $2, event_date = $3, location = $4, city = $5, region = $6, currency = $7, updated_at = NOW()
     WHERE id = $8 AND promoter_id = $9`,
    [name, description || '', eventDate, location, city || '', region || 'NYC', currency || 'USD', eventId, promoterId]
  );

  // Delete old packages and re-create
  await db.query('DELETE FROM event_packages WHERE event_id = $1', [eventId]);

  const names = Array.isArray(pkgNames) ? pkgNames : [pkgNames];
  const prices = Array.isArray(pkgPrices) ? pkgPrices : [pkgPrices];
  const descs = Array.isArray(pkgDescs) ? pkgDescs : [pkgDescs];
  const tiers = Array.isArray(pkgTiers) ? pkgTiers : [pkgTiers];

  for (let i = 0; i < names.length; i++) {
    if (names[i] && prices[i]) {
      await db.query(
        `INSERT INTO event_packages (event_id, tier, name, price, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [eventId, tiers[i] || 'Gold', names[i], parseFloat(prices[i]) || 0, descs[i] || '']
      );
    }
  }

  res.redirect(303, `/checkin/${eventId}/admin`);
});

// ─── Admin Panel ────────────────────────────────────────
router.get('/:eventId/admin', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const event = eventResult.rows[0];
  const attendeesResult = await db.query(
    'SELECT * FROM attendees WHERE checkin_event_id = $1 ORDER BY created_at DESC',
    [eventId]
  );
  const attendees = attendeesResult.rows;

  const stats = {
    total: attendees.length,
    checkedIn: attendees.filter(a => a.checked_in).length,
    goldTables: attendees.filter(a => a.table_type === 'Gold').length,
    premiumTables: attendees.filter(a => a.table_type === 'Premium').length,
    totalRevenue: attendees.reduce((sum, a) => sum + parseFloat(a.amount_paid || 0), 0),
    goldRevenue: attendees.filter(a => a.table_type === 'Gold').reduce((sum, a) => sum + parseFloat(a.amount_paid || 0), 0),
    premiumRevenue: attendees.filter(a => a.table_type === 'Premium').reduce((sum, a) => sum + parseFloat(a.amount_paid || 0), 0),
  };

  const flash = req.query;
  res.render('checkin-admin', { event, attendees, stats, flash, promoter: { name: 'promoter' } });
});

// ─── CSV Import (Eventbrite) ────────────────────────────
router.post('/:eventId/admin/import', requireAuth, upload.single('csvFile'), async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  if (!req.file) {
    return res.redirect(`/checkin/${eventId}/admin?error=No+file+uploaded`);
  }

  try {
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    let imported = 0;
    for (const row of records) {
      const name = row['First Name'] && row['Last Name']
        ? `${row['First Name']} ${row['Last Name']}`
        : row['Name'] || row['name'] || row['Attendee Name'] || '';
      const email = row['Email'] || row['email'] || row['Buyer Email'] || '';
      const phone = row['Phone'] || row['phone'] || row['Cell Phone'] || '';
      const tableType = row['Table Type'] || row['Ticket Type'] || row['table_type'] || 'General';
      const tableSize = parseInt(row['Table Size'] || row['Quantity'] || row['table_size'] || '1', 10);
      const amountPaid = parseFloat(row['Amount Paid'] || row['Order Total'] || row['amount_paid'] || '0');
      const source = row['Source'] || 'eventbrite';

      if (!name && !email) continue;

      const ticketCode = crypto.randomBytes(12).toString('hex');
      const qrData = JSON.stringify({ code: ticketCode, eventId, name });
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

      // Upsert contact
      if (email) {
        await db.query(
          `INSERT INTO contacts (email, name, phone, source, promoter_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email, promoter_id) DO UPDATE SET
             name = COALESCE(NULLIF($2, ''), contacts.name),
             phone = COALESCE(NULLIF($3, ''), contacts.phone),
             updated_at = NOW()`,
          [email, name, phone, source, promoterId]
        );
      }

      await db.query(
        `INSERT INTO attendees (checkin_event_id, name, email, phone, table_type, table_size, amount_paid, ticket_code, qr_code, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [eventId, name, email, phone, tableType, tableSize, amountPaid, ticketCode, qrDataUrl, source]
      );
      imported++;
    }

    res.redirect(`/checkin/${eventId}/admin?success=Imported+${imported}+attendees`);
  } catch (err) {
    console.error('CSV import error:', err);
    res.redirect(`/checkin/${eventId}/admin?error=CSV+parse+error:+${encodeURIComponent(err.message)}`);
  }
});

// ─── Manual Attendee Entry ──────────────────────────────
router.post('/:eventId/admin/add', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;
  const { name, email, phone, tableType, tableSize, amountPaid, saleLocation } = req.body;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  if (!name) {
    return res.redirect(`/checkin/${eventId}/admin?error=Name+is+required`);
  }

  const ticketCode = crypto.randomBytes(12).toString('hex');
  const qrData = JSON.stringify({ code: ticketCode, eventId, name });
  const qrDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

  // Upsert contact
  if (email) {
    await db.query(
      `INSERT INTO contacts (email, name, phone, source, promoter_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email, promoter_id) DO UPDATE SET
         name = COALESCE(NULLIF($2, ''), contacts.name),
         phone = COALESCE(NULLIF($3, ''), contacts.phone),
         updated_at = NOW()`,
      [email, name, phone || '', 'physical_sale', promoterId]
    );
  }

  await db.query(
    `INSERT INTO attendees (checkin_event_id, name, email, phone, table_type, table_size, amount_paid, ticket_code, qr_code, source, sale_location)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [eventId, name, email || '', phone || '', tableType || 'General', parseInt(tableSize || '1', 10),
     parseFloat(amountPaid || '0'), ticketCode, qrDataUrl, 'physical_sale', saleLocation || '']
  );

  res.redirect(`/checkin/${eventId}/admin?success=Added+${encodeURIComponent(name)}`);
});

// ─── Mobile Check-In Page ───────────────────────────────
router.get('/:eventId/scan', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  res.render('checkin-scan', { event: eventResult.rows[0], promoter: { name: 'promoter' } });
});

// ─── Check-In Verify API (JSON) ─────────────────────────
router.post('/:eventId/verify', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;
  const { ticketCode, searchQuery } = req.body;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) {
    return res.status(403).json({ valid: false, message: 'Access denied' });
  }

  let attendee = null;

  if (ticketCode) {
    const result = await db.query(
      'SELECT * FROM attendees WHERE ticket_code = $1 AND checkin_event_id = $2',
      [ticketCode, eventId]
    );
    attendee = result.rows[0] || null;
  } else if (searchQuery) {
    const q = `%${searchQuery}%`;
    const result = await db.query(
      `SELECT * FROM attendees WHERE checkin_event_id = $1
       AND (LOWER(name) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2) OR phone LIKE $2)
       LIMIT 1`,
      [eventId, q]
    );
    attendee = result.rows[0] || null;
  }

  if (!attendee) {
    return res.json({ valid: false, message: 'Not found — check the name or code' });
  }

  if (attendee.checked_in) {
    return res.json({
      valid: false,
      message: `Already checked in at ${new Date(attendee.checked_in_at).toLocaleTimeString()}`,
      attendee: { name: attendee.name, email: attendee.email, tableType: attendee.table_type, tableSize: attendee.table_size },
    });
  }

  // Check in
  await db.query(
    'UPDATE attendees SET checked_in = true, checked_in_at = NOW() WHERE id = $1',
    [attendee.id]
  );
  await db.query(
    'INSERT INTO checkin_logs (attendee_id, checkin_event_id, checked_in_by) VALUES ($1, $2, $3)',
    [attendee.id, eventId, promoterId]
  );

  return res.json({
    valid: true,
    message: 'Checked in!',
    attendee: { name: attendee.name, email: attendee.email, tableType: attendee.table_type, tableSize: attendee.table_size },
  });
});

// ─── Search Attendees API (JSON) ────────────────────────
router.get('/:eventId/search', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const { q } = req.query;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT id FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(403).json([]);

  const search = `%${q || ''}%`;
  const result = await db.query(
    `SELECT id, name, email, phone, table_type, table_size, checked_in, checked_in_at, ticket_code
     FROM attendees WHERE checkin_event_id = $1
     AND (LOWER(name) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2) OR phone LIKE $2)
     ORDER BY name ASC LIMIT 50`,
    [eventId, search]
  );
  res.json(result.rows);
});

// ─── Live Dashboard ─────────────────────────────────────
router.get('/:eventId/live', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  res.render('checkin-live', { event: eventResult.rows[0], promoter: { name: 'promoter' } });
});

// ─── Live Stats API (polled by dashboard) ───────────────
router.get('/:eventId/stats', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT id FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(403).json({});

  const result = await db.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE checked_in = true) as checked_in,
       COUNT(*) FILTER (WHERE table_type = 'Gold') as gold_total,
       COUNT(*) FILTER (WHERE table_type = 'Gold' AND checked_in = true) as gold_checked_in,
       COUNT(*) FILTER (WHERE table_type = 'Premium') as premium_total,
       COUNT(*) FILTER (WHERE table_type = 'Premium' AND checked_in = true) as premium_checked_in,
       COALESCE(SUM(amount_paid), 0) as total_revenue
     FROM attendees WHERE checkin_event_id = $1`,
    [eventId]
  );
  res.json(result.rows[0]);
});

// ─── Recent Check-Ins API (for live feed) ───────────────
router.get('/:eventId/recent', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT id FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(403).json([]);

  const result = await db.query(
    `SELECT a.name, a.table_type, a.table_size, a.checked_in_at
     FROM attendees a WHERE a.checkin_event_id = $1 AND a.checked_in = true
     ORDER BY a.checked_in_at DESC LIMIT 20`,
    [eventId]
  );
  res.json(result.rows);
});

// ─── CSV Export ─────────────────────────────────────────
router.get('/:eventId/export', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const result = await db.query(
    `SELECT name, email, phone, table_type, table_size, amount_paid, source, sale_location,
            ticket_code, checked_in, checked_in_at, created_at
     FROM attendees WHERE checkin_event_id = $1 ORDER BY created_at ASC`,
    [eventId]
  );

  const header = 'Name,Email,Phone,Table Type,Table Size,Amount Paid,Source,Sale Location,Ticket Code,Checked In,Check-In Time,Added At\n';
  const csv = header + result.rows.map(r =>
    `"${r.name}","${r.email}","${r.phone}","${r.table_type}","${r.table_size}","${r.amount_paid}","${r.source}","${r.sale_location || ''}","${r.ticket_code}","${r.checked_in ? 'Yes' : 'No'}","${r.checked_in_at || ''}","${r.created_at}"`
  ).join('\n');

  const eventName = eventResult.rows[0].name.replace(/[^a-zA-Z0-9]/g, '_');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${eventName}_attendees.csv"`);
  res.send(csv);
});

// ─── Post-Event Message Trigger ─────────────────────────
router.post('/:eventId/admin/send-followup', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT * FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(404).send('Event not found');

  const event = eventResult.rows[0];
  const attendees = await db.query(
    'SELECT name, email, phone FROM attendees WHERE checkin_event_id = $1 AND checked_in = true',
    [eventId]
  );

  let sentCount = 0;

  // Try Twilio SMS if connected
  const twilioResult = await db.query(
    'SELECT api_key, account_id FROM credentials WHERE promoter_id = $1 AND platform = $2 AND status = $3',
    [promoterId, 'twilio', 'active']
  );

  if (twilioResult.rows.length > 0) {
    try {
      const { api_key: encryptedToken, account_id: accountInfo } = twilioResult.rows[0];
      const authToken = decrypt(encryptedToken);
      const parts = accountInfo.split('|');
      const accountSid = parts[0];
      const fromNumber = parts[1];

      if (fromNumber) {
        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);

        for (const attendee of attendees.rows) {
          if (attendee.phone) {
            try {
              await client.messages.create({
                body: `Thanks for coming to ${event.name}! We'd love your feedback: How was your experience? Reply GREAT, GOOD, or MEH. Stay tuned for our next event!`,
                from: fromNumber,
                to: attendee.phone,
              });
              sentCount++;
            } catch (smsErr) {
              console.error('SMS send error:', smsErr.message);
            }
          }
        }
      }
    } catch (err) {
      console.error('Twilio followup error:', err.message);
    }
  }

  // Log the followup
  await db.query(
    'UPDATE checkin_events SET followup_sent_at = NOW() WHERE id = $1',
    [eventId]
  );

  res.redirect(`/checkin/${eventId}/admin?success=Followup+sent+to+${sentCount}+attendees`);
});

// ─── Attendee QR Code / Ticket Page (public) ────────────
router.get('/:eventId/ticket/:ticketCode', async (req, res) => {
  const { eventId, ticketCode } = req.params;
  const result = await db.query(
    `SELECT a.*, ce.name as event_name, ce.event_date, ce.location
     FROM attendees a JOIN checkin_events ce ON a.checkin_event_id = ce.id
     WHERE a.ticket_code = $1 AND ce.id = $2`,
    [ticketCode, eventId]
  );
  if (result.rows.length === 0) return res.status(404).send('Ticket not found');
  res.render('checkin-ticket', { attendee: result.rows[0], promoter: null });
});

// ─── All Attendees API (for offline caching) ────────────
router.get('/:eventId/attendees-json', requireAuth, async (req, res) => {
  const { eventId } = req.params;
  const promoterId = req.session.promoterId;

  const eventResult = await db.query(
    'SELECT id FROM checkin_events WHERE id = $1 AND promoter_id = $2',
    [eventId, promoterId]
  );
  if (eventResult.rows.length === 0) return res.status(403).json([]);

  const result = await db.query(
    `SELECT id, name, email, phone, table_type, table_size, ticket_code, checked_in, checked_in_at
     FROM attendees WHERE checkin_event_id = $1 ORDER BY name ASC`,
    [eventId]
  );
  res.json(result.rows);
});

module.exports = router;
