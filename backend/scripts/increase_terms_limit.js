/* backend/scripts/increase_terms_limit.js */
const pool = require('../config/database');

async function migrate() {
  try {
    console.log('Increasing terms_and_conditions limit to 2000 characters...');
    await pool.query('ALTER TABLE listings ALTER COLUMN terms_and_conditions TYPE VARCHAR(2000)');
    console.log('✅ Success: listings.terms_and_conditions limit increased.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
