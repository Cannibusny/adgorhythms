require('dotenv').config();
const { pool } = require('./index');
const { MIGRATION_SQL } = require('./schema');

async function migrate() {
  console.log('Running database migration...');
  try {
    await pool.query(MIGRATION_SQL);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
