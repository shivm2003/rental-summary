/* backend/scripts/location_migration.js
   Run: node scripts/location_migration.js
*/
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT || 5432 }
);

// ── Location Groups Master Data ──────────────────────────────────────────────
// Each entry: { display_name, region, aliases[] }
const LOCATIONS = [
  {
    display_name: 'Delhi NCR',
    region: 'North India',
    aliases: [
      'Delhi', 'New Delhi', 'Delhi NCR', 'NCR', 'Central Delhi', 'South Delhi',
      'North Delhi', 'West Delhi', 'East Delhi', 'North East Delhi', 'North West Delhi',
      'South East Delhi', 'South West Delhi', 'Shahdara', 'Dwarka', 'Rohini',
      'Pitampura', 'Lajpat Nagar', 'Saket', 'Vasant Kunj', 'Karol Bagh',
      'Connaught Place', 'Janakpuri', 'Mayur Vihar',
    ]
  },
  {
    display_name: 'Gurgaon / Gurugram',
    region: 'North India',
    aliases: [
      'Gurgaon', 'Gurugram', 'Gurgaon Haryana', 'Cyber City', 'DLF',
      'Sohna Road', 'Golf Course Road', 'MG Road Gurgaon',
    ]
  },
  {
    display_name: 'Noida / Greater Noida',
    region: 'North India',
    aliases: [
      'Noida', 'Greater Noida', 'Noida Extension', 'Sector 62 Noida',
      'Sector 18 Noida', 'Indirapuram', 'Vaishali', 'Vasundhara',
    ]
  },
  {
    display_name: 'Faridabad',
    region: 'North India',
    aliases: ['Faridabad', 'Faridabad Haryana', 'NIT Faridabad']
  },
  {
    display_name: 'Ghaziabad',
    region: 'North India',
    aliases: ['Ghaziabad', 'Gzb', 'Kaushambi', 'Raj Nagar Extension']
  },
  {
    display_name: 'Mumbai',
    region: 'West India',
    aliases: [
      'Mumbai', 'Bombay', 'Mumbai City', 'Mumbai Suburban', 'Western Mumbai',
      'Andheri', 'Bandra', 'Powai', 'Juhu', 'Dadar', 'Kurla', 'Borivali',
      'Malad', 'Goregaon', 'Kandivali', 'Chembur', 'Ghatkopar',
    ]
  },
  {
    display_name: 'Navi Mumbai',
    region: 'West India',
    aliases: ['Navi Mumbai', 'Kharghar', 'Vashi', 'Nerul', 'Panvel', 'Belapur']
  },
  {
    display_name: 'Thane',
    region: 'West India',
    aliases: ['Thane', 'Thane City', 'Kalyan', 'Dombivli', 'Ulhasnagar', 'Bhiwandi']
  },
  {
    display_name: 'Pune',
    region: 'West India',
    aliases: [
      'Pune', 'Pune', 'Hinjewadi', 'Wakad', 'Baner', 'Kothrud', 'Hadapsar',
      'Viman Nagar', 'Kharadi', 'Shivajinagar', 'Pimpri Chinchwad',
    ]
  },
  {
    display_name: 'Bengaluru',
    region: 'South India',
    aliases: [
      'Bangalore', 'Bengaluru', 'Bangalore Urban', 'Whitefield', 'Koramangala',
      'Indiranagar', 'HSR Layout', 'Electronic City', 'Marathahalli', 'Jayanagar',
      'JP Nagar', 'Banashankari', 'Hebbal', 'Yelahanka', 'BTM Layout',
    ]
  },
  {
    display_name: 'Chennai',
    region: 'South India',
    aliases: [
      'Chennai', 'Madras', 'Anna Nagar', 'T Nagar', 'Velachery', 'Adyar',
      'Porur', 'Tambaram', 'Sholinganallur', 'OMR Chennai',
    ]
  },
  {
    display_name: 'Hyderabad',
    region: 'South India',
    aliases: [
      'Hyderabad', 'Secunderabad', 'HITEC City', 'Gachibowli', 'Madhapur',
      'Banjara Hills', 'Jubilee Hills', 'Kondapur', 'Kukatpally', 'Uppal',
    ]
  },
  {
    display_name: 'Kolkata',
    region: 'East India',
    aliases: [
      'Kolkata', 'Calcutta', 'Howrah', 'Salt Lake', 'Rajarhat', 'New Town Kolkata',
      'Park Street', 'Dum Dum',
    ]
  },
  {
    display_name: 'Ahmedabad',
    region: 'West India',
    aliases: [
      'Ahmedabad', 'Amdavad', 'Satellite Ahmedabad', 'Prahlad Nagar',
      'Bopal', 'Maninagar', 'Navrangpura',
    ]
  },
  {
    display_name: 'Surat',
    region: 'West India',
    aliases: ['Surat', 'Adajan', 'Vesu', 'Katargam']
  },
  {
    display_name: 'Jaipur',
    region: 'North India',
    aliases: [
      'Jaipur', 'Jaipuri', 'Malviya Nagar Jaipur', 'Vaishali Nagar Jaipur',
      'Mansarovar Jaipur',
    ]
  },
  {
    display_name: 'Lucknow',
    region: 'North India',
    aliases: ['Lucknow', 'Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar Lucknow']
  },
  {
    display_name: 'Chandigarh',
    region: 'North India',
    aliases: ['Chandigarh', 'Mohali', 'Panchkula', 'Tricity']
  },
  {
    display_name: 'Amritsar',
    region: 'North India',
    aliases: ['Amritsar']
  },
  {
    display_name: 'Ludhiana',
    region: 'North India',
    aliases: ['Ludhiana']
  },
  {
    display_name: 'Indore',
    region: 'Central India',
    aliases: ['Indore', 'Vijay Nagar Indore', 'Vijay Nagar']
  },
  {
    display_name: 'Bhopal',
    region: 'Central India',
    aliases: ['Bhopal', 'MP Nagar', 'Arera Colony']
  },
  {
    display_name: 'Nagpur',
    region: 'Central India',
    aliases: ['Nagpur', 'Dharampeth', 'Ramdaspeth']
  },
  {
    display_name: 'Patna',
    region: 'East India',
    aliases: ['Patna', 'Boring Road', 'Kankarbagh']
  },
  {
    display_name: 'Coimbatore',
    region: 'South India',
    aliases: ['Coimbatore', 'Peelamedu', 'Gandhipuram', 'RS Puram']
  },
  {
    display_name: 'Kochi',
    region: 'South India',
    aliases: ['Kochi', 'Cochin', 'Ernakulam', 'Edapally', 'Kakkanad']
  },
  {
    display_name: 'Thiruvananthapuram',
    region: 'South India',
    aliases: ['Thiruvananthapuram', 'Trivandrum', 'Pattom', 'Kowdiar']
  },
  {
    display_name: 'Visakhapatnam',
    region: 'South India',
    aliases: ['Visakhapatnam', 'Vizag', 'Gajuwaka']
  },
  {
    display_name: 'Agra',
    region: 'North India',
    aliases: ['Agra']
  },
  {
    display_name: 'Varanasi',
    region: 'North India',
    aliases: ['Varanasi', 'Banaras', 'Kashi']
  },
  {
    display_name: 'Dehradun',
    region: 'North India',
    aliases: ['Dehradun', 'Doon', 'Rajpur Road']
  },
];

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Step 1: Create tables ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS location_groups (
        id           SERIAL PRIMARY KEY,
        display_name TEXT NOT NULL UNIQUE,
        region       TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS location_aliases (
        id       SERIAL PRIMARY KEY,
        group_id INT NOT NULL REFERENCES location_groups(id) ON DELETE CASCADE,
        alias    TEXT NOT NULL,
        UNIQUE(alias)
      );
    `);

    await client.query(`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_group_id INT REFERENCES location_groups(id);
    `);

    console.log('✅ Tables created');

    // ── Step 2: Seed location groups ───────────────────────────────────────
    for (const loc of LOCATIONS) {
      // Upsert group
      const { rows: [group] } = await client.query(
        `INSERT INTO location_groups (display_name, region)
         VALUES ($1, $2)
         ON CONFLICT (display_name) DO UPDATE SET region = EXCLUDED.region
         RETURNING id`,
        [loc.display_name, loc.region]
      );
      const groupId = group.id;

      // Upsert all aliases
      for (const alias of loc.aliases) {
        await client.query(
          `INSERT INTO location_aliases (group_id, alias)
           VALUES ($1, $2)
           ON CONFLICT (alias) DO NOTHING`,
          [groupId, alias]
        );
      }
    }

    console.log('✅ Seeded', LOCATIONS.length, 'location groups');

    // ── Step 3: Auto-migrate existing listings ─────────────────────────────
    // Match each listing's location text against any alias
    const { rowCount } = await client.query(`
      UPDATE listings l
      SET location_group_id = la.group_id
      FROM location_aliases la
      WHERE l.location_group_id IS NULL
        AND (
          l.location ILIKE '%' || la.alias || '%'
          OR la.alias ILIKE '%' || l.location || '%'
        )
    `);

    console.log('✅ Auto-migrated', rowCount, 'listings to location groups');

    await client.query('COMMIT');

    // ── Report ─────────────────────────────────────────────────────────────
    const { rows: groups } = await pool.query(
      'SELECT g.id, g.display_name, COUNT(l.id) AS listings_count FROM location_groups g LEFT JOIN listings l ON l.location_group_id = g.id GROUP BY g.id, g.display_name ORDER BY listings_count DESC'
    );
    console.log('\n📊 Location Groups Summary:');
    groups.forEach(g => {
      if (parseInt(g.listings_count) > 0) {
        console.log(`  [${g.id}] ${g.display_name}: ${g.listings_count} listings`);
      }
    });

    const { rows: [{ unlinked }] } = await pool.query(
      'SELECT COUNT(*) AS unlinked FROM listings WHERE location_group_id IS NULL'
    );
    if (parseInt(unlinked) > 0) {
      const { rows: missed } = await pool.query(
        "SELECT id, location FROM listings WHERE location_group_id IS NULL LIMIT 10"
      );
      console.log(`\n⚠️  ${unlinked} listings couldn't be auto-mapped. Their locations:`);
      missed.forEach(r => console.log(`  ID ${r.id}: "${r.location}"`));
      console.log('  → Add aliases for these to location_aliases table manually.');
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
