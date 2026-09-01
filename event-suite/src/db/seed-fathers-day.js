require('dotenv').config();
const crypto = require('crypto');
const { pool } = require('./index');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function seed() {
  console.log('Seeding Father\'s Day Comedy Show...');

  try {
    // Ensure a promoter exists
    const existingPromoter = await pool.query('SELECT id FROM promoters LIMIT 1');
    let promoterId;

    if (existingPromoter.rows.length > 0) {
      promoterId = existingPromoter.rows[0].id;
      console.log('Using existing promoter:', promoterId);
    } else {
      const hash = hashPassword('ADgorhythms2026!');
      const result = await pool.query(
        `INSERT INTO promoters (email, password_hash, name, business_name, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['admin@adgorhythms.com', hash, 'JJ Williams', 'ADgorhythms', '+15551234567']
      );
      promoterId = result.rows[0].id;
      console.log('Created promoter:', promoterId);
    }

    // Check if event already exists
    const existingEvent = await pool.query(
      'SELECT id FROM events WHERE name = $1',
      ['Father\'s Day Comedy Show']
    );

    let eventId;
    if (existingEvent.rows.length > 0) {
      eventId = existingEvent.rows[0].id;
      console.log('Event already exists:', eventId);
    } else {
      const eventResult = await pool.query(
        `INSERT INTO events (promoter_id, name, description, event_date, location, ticket_price, max_capacity)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          promoterId,
          'Father\'s Day Comedy Show',
          "Celebrate Father's Day with an evening of laughs! Join us for a hilarious night of stand-up comedy featuring top comedians. Bring your dad, bring your friends — this is the party of the summer! Doors open at 6:30 PM. Show starts at 7:30 PM. Food and drinks available.",
          '2026-06-15T19:30:00',
          'Dreiser Auditorium',
          25.00,
          500,
        ]
      );
      eventId = eventResult.rows[0].id;
      console.log('Created event:', eventId);
    }

    // Seed ticket tiers
    const existingTiers = await pool.query(
      'SELECT id FROM ticket_tiers WHERE event_id = $1',
      [eventId]
    );

    if (existingTiers.rows.length === 0) {
      const tiers = [
        { name: 'VIP', price: 50.00, quantity: 50, description: 'Front row seating, VIP lounge access, complimentary drink', sort: 0 },
        { name: 'General', price: 25.00, quantity: 350, description: 'General admission seating', sort: 1 },
        { name: 'Student', price: 15.00, quantity: 100, description: 'Valid student ID required at check-in', sort: 2 },
      ];

      for (const tier of tiers) {
        await pool.query(
          `INSERT INTO ticket_tiers (event_id, name, price, quantity, description, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [eventId, tier.name, tier.price, tier.quantity, tier.description, tier.sort]
        );
      }
      console.log('Created ticket tiers: VIP ($50), General ($25), Student ($15)');
    } else {
      console.log('Ticket tiers already exist');
    }

    // Seed promo codes
    const existingPromos = await pool.query(
      'SELECT id FROM promo_codes WHERE event_id = $1',
      [eventId]
    );

    if (existingPromos.rows.length === 0) {
      const promos = [
        { code: 'EARLYDAD', type: 'percentage', value: 20, maxUses: 50 },
        { code: 'FAMILY5', type: 'fixed', value: 5, maxUses: 100 },
        { code: 'VIP2026', type: 'percentage', value: 10, maxUses: 25 },
      ];

      for (const promo of promos) {
        await pool.query(
          `INSERT INTO promo_codes (event_id, code, discount_type, discount_value, max_uses)
           VALUES ($1, $2, $3, $4, $5)`,
          [eventId, promo.code, promo.type, promo.value, promo.maxUses]
        );
      }
      console.log('Created promo codes: EARLYDAD (20% off), FAMILY5 ($5 off), VIP2026 (10% off)');
    } else {
      console.log('Promo codes already exist');
    }

    console.log('\n--- SEED COMPLETE ---');
    console.log(`Event ID: ${eventId}`);
    console.log(`Public URL: /events/${eventId}`);
    console.log(`Admin URL: /events/${eventId}/admin`);
    console.log(`Check-In URL: /events/${eventId}/checkin`);
    console.log(`Live Dashboard: /events/${eventId}/live`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

seed();
