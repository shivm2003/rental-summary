const { query } = require('../config/database');
require('dotenv').config();

const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id BIGSERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(15) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        account_status VARCHAR(20) DEFAULT 'pending' CHECK (account_status IN ('active', 'inactive', 'suspended', 'pending')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMPTZ NULL
      )
    `);
    
    // Create user_profiles table
    await query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        profile_id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        profile_picture_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create login_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        device_info TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        login_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        expiry_time TIMESTAMPTZ NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_login_sessions_expiry_time ON login_sessions(expiry_time)');
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Run if this script is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;