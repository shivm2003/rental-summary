-- Migration: Add OTP and Verification Fields to Users Table
-- Description: Adds 'is_verified', 'otp_code', and 'otp_expires_at' to support email verification during manual registration.

DO $$ 
BEGIN 
  -- Add is_verified column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
    ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;

  -- Add otp_code column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='otp_code') THEN
    ALTER TABLE users ADD COLUMN otp_code VARCHAR(10);
  END IF;

  -- Add otp_expires_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='otp_expires_at') THEN
    ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP;
  END IF;
  
  -- Add role column in case it doesn't already exist (from earlier logic)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
  END IF;
END $$;
