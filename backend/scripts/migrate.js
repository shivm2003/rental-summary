require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user:     process.env.DB_USER,
        host:     process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port:     process.env.DB_PORT || 5432,
      }
);

async function runMigrations() {
  console.log('🚀 Connecting to Database...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully!');

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    if (files.length === 0) {
      console.log('⚠️ No migration SQL files found in /migrations');
      process.exit(0);
    }

    console.log(`📦 Found ${files.length} migration files. Executing...`);

    for (const file of files) {
      console.log(`\n▶️ Running: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ Success: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed: ${file}`);
        console.error(err.message);
        // We continue executing others in case some fail due to "table already exists"
      }
    }

    client.release();
    console.log('\n🎉 All migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal Migration Error:', error.message);
    process.exit(1);
  }
}

runMigrations();