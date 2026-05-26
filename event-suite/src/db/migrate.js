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

CREATE INDEX IF NOT EXISTS idx_credentials_expiry
  ON credentials (token_expires_at)
  WHERE status = 'active';
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

-- Ticket tiers
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event ON ticket_tiers (event_id);

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  times_used INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, code)
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes (event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes (code);

-- Add new columns to tickets (idempotent via IF NOT EXISTS pattern)
DO $$ BEGIN
  ALTER TABLE tickets ADD COLUMN tier_name VARCHAR(100) DEFAULT 'General';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE tickets ADD COLUMN stripe_session_id VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE tickets ADD COLUMN stripe_payment_intent VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE tickets ADD COLUMN promo_code VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE tickets ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

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

-- Check-In System tables
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100) DEFAULT 'manual',
  city VARCHAR(100),
  region VARCHAR(100),
  tags TEXT DEFAULT '',
  total_events_attended INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, promoter_id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_promoter ON contacts (promoter_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);

CREATE TABLE IF NOT EXISTS checkin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(500) NOT NULL,
  city VARCHAR(100) DEFAULT '',
  region VARCHAR(100) DEFAULT 'NYC',
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active',
  followup_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checkin_events_promoter ON checkin_events (promoter_id);

CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_event_id UUID REFERENCES checkin_events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  table_type VARCHAR(50) DEFAULT 'General',
  table_size INTEGER DEFAULT 1,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  ticket_code VARCHAR(64) UNIQUE NOT NULL,
  qr_code TEXT,
  source VARCHAR(100) DEFAULT 'manual',
  sale_location VARCHAR(255) DEFAULT '',
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees (checkin_event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_code ON attendees (ticket_code);
CREATE INDEX IF NOT EXISTS idx_attendees_name ON attendees (LOWER(name));

CREATE TABLE IF NOT EXISTS checkin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  checkin_event_id UUID REFERENCES checkin_events(id) ON DELETE CASCADE,
  checked_in_by UUID REFERENCES promoters(id),
  checked_in_at TIMESTAMP DEFAULT NOW()
);
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
