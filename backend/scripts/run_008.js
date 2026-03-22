const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

(async () => {
  try {
    const file = path.resolve(__dirname, '../migrations/008_add_rental_management.sql');
    const sql = fs.readFileSync(file, 'utf8');
    await query(sql);
    console.log(`✅ Successfully applied: 008_add_rental_management.sql`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
