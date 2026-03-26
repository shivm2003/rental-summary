const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT || 5432,
});

async function setupLocalDB() {
  try {
    console.log(`Connecting to local database: ${process.env.DB_NAME}...`);
    const client = await pool.connect();
    
    const schemaPath = path.join(__dirname, 'migrations', '000_schema_dump.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Cleaning local schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

    const cleanSql = schemaSql
        .replace(/SELECT pg_catalog\.set_config\('search_path', '', false\);/g, '-- removed search_path config')
        .replace(/CREATE SCHEMA public;/g, '-- public already exists')
        .replace(/ALTER SCHEMA public OWNER TO .*/g, '-- removed owner alter');

    console.log('Executing schema dump...');
    await client.query(cleanSql);

    console.log('Adding new custom profile tables...');
    const newTablesSql = `
      ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_gender_check;
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_gender_check CHECK (gender IN ('Male', 'Female', 'Other'));

      CREATE TABLE IF NOT EXISTS user_pan_info (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        pan_number VARCHAR(10) UNIQUE,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_gift_cards (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        card_number VARCHAR(16) UNIQUE,
        pin VARCHAR(6),
        balance DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_saved_upi (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        vpa VARCHAR(255),
        name VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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
    `;
    await client.query(newTablesSql);

    client.release();
    console.log('✅ Local Database Setup Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Local Setup Failed:', err.message);
    process.exit(1);
  }
}

setupLocalDB();
