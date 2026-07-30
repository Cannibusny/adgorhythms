const express = require('express');
const db = require('../db');
const { eventSchema, injectSchemas } = require('../utils/schema');

const router = express.Router();

// ─── Public Event Registration Page (no auth) ───────────
router.get('/:eventId', async (req, res) => {
  const { eventId } = req.params;

  try {
    const eventResult = await db.query(
      `SELECT ce.*, p.business_name
       FROM checkin_events ce
       JOIN promoters p ON ce.promoter_id = p.id
       WHERE ce.id = $1 AND ce.status = 'active'`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).send('Event not found');
    }

    const event = eventResult.rows[0];

    // Get packages for this event
    const packagesResult = await db.query(
      'SELECT * FROM event_packages WHERE event_id = $1 ORDER BY tier, price ASC',
      [eventId]
    );

    // Get registration count
    const regCount = await db.query(
      'SELECT COUNT(*) as count FROM guest_registrations WHERE event_id = $1',
      [eventId]
    );

    const extraSchemas = injectSchemas([eventSchema(event)]);
    res.render('event-register', {
      event,
      packages: packagesResult.rows,
      registrationCount: parseInt(regCount.rows[0].count, 10),
      promoter: null,
      error: null,
      form: null,
      extraSchemas,
    });
  } catch (err) {
    console.error('Error loading event registration:', err);
    res.status(500).send('Something went wrong');
  }
});

// ─── Handle Registration Submission ─────────────────────
router.post('/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { fullName, phone, email, groupSize, packageId, notes } = req.body;

  try {
    // Validate required fields
    if (!fullName || !phone || !email) {
      const eventResult = await db.query(
        `SELECT ce.*, p.business_name FROM checkin_events ce
         JOIN promoters p ON ce.promoter_id = p.id WHERE ce.id = $1`,
        [eventId]
      );
      const packagesResult = await db.query(
        'SELECT * FROM event_packages WHERE event_id = $1 ORDER BY tier, price ASC',
        [eventId]
      );
      return res.render('event-register', {
        event: eventResult.rows[0],
        packages: packagesResult.rows,
        registrationCount: 0,
        promoter: null,
        error: 'Full name, phone, and email are required.',
        form: req.body,
      });
    }

    // Get event info for the thank you page
    const eventResult = await db.query(
      `SELECT ce.*, p.business_name FROM checkin_events ce
       JOIN promoters p ON ce.promoter_id = p.id WHERE ce.id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).send('Event not found');
    }

    const event = eventResult.rows[0];

    // Get selected package details (if any)
    let selectedPackage = null;
    if (packageId) {
      const pkgResult = await db.query(
        'SELECT * FROM event_packages WHERE id = $1',
        [packageId]
      );
      if (pkgResult.rows.length > 0) {
        selectedPackage = pkgResult.rows[0];
      }
    }

    // Insert registration
    await db.query(
      `INSERT INTO guest_registrations (event_id, promoter_id, full_name, phone, email, group_size, package_id, package_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventId,
        event.promoter_id,
        fullName.trim(),
        phone.trim(),
        email.trim().toLowerCase(),
        parseInt(groupSize, 10) || 1,
        packageId || null,
        selectedPackage ? `${selectedPackage.tier} - ${selectedPackage.name}` : null,
        notes || null,
      ]
    );

    // Also add to contacts table for the promoter's database
    await db.query(
      `INSERT INTO contacts (promoter_id, email, name, phone, source, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email, promoter_id) DO UPDATE SET
         name = EXCLUDED.name, phone = EXCLUDED.phone, updated_at = NOW()`,
      [event.promoter_id, email.trim().toLowerCase(), fullName.trim(), phone.trim(), 'event-registration', event.city || '']
    );

    res.render('event-thankyou', {
      event,
      guest: { fullName, email, phone, groupSize: parseInt(groupSize, 10) || 1 },
      selectedPackage,
      promoter: null,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

module.exports = router;
