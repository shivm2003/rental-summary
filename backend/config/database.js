require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for remote Neon databases
      }
    : {
        user:     process.env.DB_USER,
        host:     process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port:     process.env.DB_PORT || 5432,
      }
);

pool.on('error', (err, client) => {
  console.error('Unexpected database error on idle client', err);
});

pool.connect()
  .then((client) => {
    console.log('PostgreSQL connected');
    client.release(); // IMPORTANT: Release the initial test client to prevent crashes!
  })
  .catch((err) => console.error('Connection error', err.stack));

module.exports = pool;
