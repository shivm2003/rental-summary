const pool = require('../config/database');

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delivery charges table (amount-based rules)
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_charges (
        id SERIAL PRIMARY KEY,
        min_amount NUMERIC NOT NULL DEFAULT 0,
        max_amount NUMERIC,
        charge NUMERIC NOT NULL DEFAULT 0
      );
    `);

    // Seed default delivery charge rules
    await client.query(`
      INSERT INTO delivery_charges (min_amount, max_amount, charge)
      SELECT * FROM (VALUES
        (0, 299, 79),
        (300, 499, 49),
        (500, NULL::NUMERIC, 0)
      ) AS v(min_amount, max_amount, charge)
      WHERE NOT EXISTS (SELECT 1 FROM delivery_charges);
    `);

    // Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        lender_id BIGINT,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
        discount_value NUMERIC NOT NULL,
        min_order_amount NUMERIC DEFAULT 0,
        max_discount NUMERIC,
        usage_limit INTEGER DEFAULT 100,
        used_count INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('✅ delivery_charges and coupons tables created with seed data!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

createTables();
