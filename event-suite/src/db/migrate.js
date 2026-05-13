require('dotenv').config();
const { pool } = require('./index');

const migration = `
-- Promoters table
CREATE TABLE IF NOT EXISTS promoters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  business_name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credentials vault
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  api_key TEXT,
  account_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  last_refreshed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(promoter_id, platform)
);

-- Index for token refresh queries
CREATE INDEX IF NOT EXISTS idx_credentials_expiry
  ON credentials (token_expires_at)
  WHERE status = 'active';

-- Index for promoter lookups
CREATE INDEX IF NOT EXISTS idx_credentials_promoter
  ON credentials (promoter_id);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(500) NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_capacity INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_promoter
  ON events (promoter_id);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(50),
  ticket_code VARCHAR(64) UNIQUE NOT NULL,
  qr_code TEXT,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'confirmed',
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_event
  ON tickets (event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_code
  ON tickets (ticket_code);

-- Check-ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  checked_in_by UUID REFERENCES promoters(id),
  checked_in_at TIMESTAMP DEFAULT NOW()
);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_promoters_updated_at'
  ) THEN
    CREATE TRIGGER trg_promoters_updated_at
      BEFORE UPDATE ON promoters
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_credentials_updated_at'
  ) THEN
    CREATE TRIGGER trg_credentials_updated_at
      BEFORE UPDATE ON credentials
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END;
$$;
`;

async function migrate() {
  console.log('Running database migration...');
  try {
    await pool.query(migration);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
