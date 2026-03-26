const { Client, Pool } = require('pg');
require('dotenv').config();

async function createAndSetup() {
  const dbName = 'everything_rental'; // Consistent lowercase
  const config = {
    user:     process.env.DB_USER || 'postgres',
    host:     process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'Shivam@123',
    port:     process.env.DB_PORT || 5432,
  };

  const masterClient = new Client({ ...config, database: 'postgres' });
  
  try {
    await masterClient.connect();
    console.log('Connected to master postgres DB');
    
    const { rows } = await masterClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await masterClient.query(`CREATE DATABASE ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
    await masterClient.end();

    // Now run the setup on this DB
    const pool = new Pool({ ...config, database: dbName });
    const client = await pool.connect();
    console.log(`Connected to target DB: ${dbName}`);

    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'migrations', '000_schema_dump.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Cleaning schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

    const cleanSql = schemaSql
        .replace(/SELECT pg_catalog\.set_config\('search_path', '', false\);/g, '-- removed path')
        .replace(/CREATE SCHEMA public;/g, '-- exists')
        .replace(/ALTER SCHEMA public OWNER TO .*/g, '-- removed owner');

    console.log('Executing dump...');
    await client.query(cleanSql);

    console.log('Adding profile tables...');
    await client.query(`
      ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_gender_check;
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_gender_check CHECK (gender IN ('Male', 'Female', 'Other'));
      CREATE TABLE IF NOT EXISTS user_pan_info (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id) ON DELETE CASCADE, pan_number VARCHAR(10) UNIQUE, full_name VARCHAR(255));
      CREATE TABLE IF NOT EXISTS user_gift_cards (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id) ON DELETE CASCADE, card_number VARCHAR(16) UNIQUE, pin VARCHAR(6), balance DECIMAL(10,2) DEFAULT 0);
      CREATE TABLE IF NOT EXISTS user_saved_upi (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id) ON DELETE CASCADE, vpa VARCHAR(255), name VARCHAR(255));
      CREATE TABLE IF NOT EXISTS user_saved_cards (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id) ON DELETE CASCADE, card_number VARCHAR(16), name_on_card VARCHAR(255));
    `);

    client.release();
    console.log('✅ Schema Setup Successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

createAndSetup();
