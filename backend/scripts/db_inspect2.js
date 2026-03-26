const pool = require('../config/database');
async function inspect() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;");
    const fs = require('fs');
    fs.writeFileSync('users_schema.json', JSON.stringify(res.rows, null, 2));
    console.log('Done');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
inspect();
