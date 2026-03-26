const { Pool } = require('pg');
require('dotenv').config();

const prodPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const localPool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT || 5432,
});

const tablesToSync = [
  'categories',
  'users',
  'user_profiles',
  'listings',
  'listing_photos',
  'hero_banners',
  'pincode_master',
  'orders',
  'reviews',
  'notifications',
  'chat_rooms',
  'chat_messages',
  'lender_applications',
  'user_addresses',
  'user_pan_info',
  'user_gift_cards',
  'user_saved_upi',
  'user_saved_cards'
];

async function syncData() {
  try {
    console.log('🚀 Starting Data Sync from Production to Local...');
    
    const prodClient = await prodPool.connect();
    const localClient = await localPool.connect();

    console.log('✅ Connected to both databases');

    // Disable triggers to avoid foreign key issues during bulk insert
    await localClient.query('SET session_replication_role = "replica"');

    for (const table of tablesToSync) {
      console.log(`\n📦 Syncing table: ${table}...`);
      
      // 1. Fetch from Prod
      const { rows } = await prodClient.query(`SELECT * FROM ${table}`);
      console.log(`   Fetched ${rows.length} rows`);

      if (rows.length === 0) continue;

      // 2. Clear Local
      await localClient.query(`TRUNCATE TABLE ${table} CASCADE`);

      // 3. Build Multi-row Insert
      const columns = Object.keys(rows[0]);
      const columnNames = columns.join(', ');
      
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        await localClient.query(`INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`, values);
      }
      
      console.log(`   ✅ Successfully synced ${table}`);
    }

    // Restore triggers
    await localClient.query('SET session_replication_role = "origin"');

    prodClient.release();
    localClient.release();
    
    console.log('\n🌟 Data Synchronization Complete! 🚀');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync Failed:', err.message);
    process.exit(1);
  }
}

syncData();
