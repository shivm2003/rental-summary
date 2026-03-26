const pool = require('./config/database');

async function migrate() {
  try {
    const client = await pool.connect();
    console.log("Connected to DB, running migration...");
    await client.query("ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20) DEFAULT 'day';");
    console.log("Column price_unit added successfully!");
    client.release();
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
