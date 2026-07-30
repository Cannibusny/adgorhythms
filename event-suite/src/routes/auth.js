const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verify;
}

router.get('/login', (_req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      'SELECT id, password_hash FROM promoters WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0 || !verifyPassword(password, result.rows[0].password_hash)) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.promoterId = result.rows[0].id;
    res.redirect(303, '/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Something went wrong' });
  }
});

router.get('/register', (_req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { email, password, name, businessName, phone } = req.body;
  try {
    const existing = await db.query('SELECT id FROM promoters WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.render('register', { error: 'Email already registered' });
    }

    const passwordHash = hashPassword(password);
    const result = await db.query(
      `INSERT INTO promoters (email, password_hash, name, business_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, passwordHash, name, businessName, phone]
    );

    req.session.promoterId = result.rows[0].id;
    res.redirect(303, '/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', { error: 'Something went wrong' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(303, '/login');
  });
});

module.exports = router;
