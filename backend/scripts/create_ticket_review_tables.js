const pool = require('../config/database');

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create queries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        product_id INTEGER NOT NULL,
        subject VARCHAR(200),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        order_id VARCHAR(50),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, user_id, order_id)
      );
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

createTables();
