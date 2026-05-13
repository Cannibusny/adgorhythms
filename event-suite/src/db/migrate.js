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
