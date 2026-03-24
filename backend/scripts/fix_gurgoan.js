require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT || 5432 }
);

async function fix() {
  const { rows: [g] } = await pool.query("SELECT id FROM location_groups WHERE display_name = 'Gurgaon / Gurugram'");
  if (!g) { console.log('Group not found'); return pool.end(); }
  await pool.query('INSERT INTO location_aliases (group_id, alias) VALUES ($1, $2) ON CONFLICT (alias) DO NOTHING', [g.id, 'Gurgoan']);
  await pool.query('INSERT INTO location_aliases (group_id, alias) VALUES ($1, $2) ON CONFLICT (alias) DO NOTHING', [g.id, 'Gurgon']);
  const { rowCount } = await pool.query("UPDATE listings SET location_group_id = $1 WHERE location ILIKE '%Gurg%' AND location_group_id IS NULL", [g.id]);
  console.log('Fixed! Updated', rowCount, 'listings');
  await pool.end();
}
fix().catch(e => { console.error(e.message); pool.end(); });
