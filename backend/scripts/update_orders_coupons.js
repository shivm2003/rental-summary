const pool = require('../config/database');

async function updateOrdersTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS coupon_id INTEGER REFERENCES coupons(id),
      ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
    `);
    console.log('✅ orders table updated with coupon columns!');
  } catch (error) {
    console.error('Error updating orders table:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateOrdersTable();
