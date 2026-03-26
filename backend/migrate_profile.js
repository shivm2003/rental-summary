const pool = require('./config/database');

async function fixConstraintAndVerify() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    // Log DATABASE_URL (masking password) if possible
    const dbUrl = process.env.DATABASE_URL || 'Local DB';
    console.log(`Using Database: ${dbUrl.split('@')[1] || 'Local'}`);

    await client.query('BEGIN');
    
    // 1. Drop the constraint
    console.log('Dropping gender constraint...');
    await client.query('ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_gender_check');
    
    // 2. Re-create the constraint
    console.log('Adding updated gender constraint...');
    await client.query("ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_gender_check CHECK (gender IN ('Male', 'Female', 'Other'))");
    
    await client.query('COMMIT');
    console.log('✅ Constraint successfully updated to support Male/Female/Other');

    // 3. Create missing tables for the large request
    console.log('Creating additional tables for Profile features...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_pan_info (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        pan_number VARCHAR(10) UNIQUE,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_gift_cards (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        card_number VARCHAR(16) UNIQUE,
        pin VARCHAR(6),
        balance DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_saved_upi (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        vpa VARCHAR(255),
        name VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_saved_cards (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        card_number VARCHAR(16),
        name_on_card VARCHAR(255),
        expiry_month INT,
        expiry_year INT,
        card_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ All requested tables created successfully');
    process.exit(0);
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (client) client.release();
  }
}

fixConstraintAndVerify();
