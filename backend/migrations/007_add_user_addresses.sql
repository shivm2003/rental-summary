-- ============================================
-- Migration: 007_add_user_addresses.sql
-- Created: 2026-03-15
-- Description: Add user address management system
-- ============================================

-- Create addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Address type
    type VARCHAR(20) NOT NULL DEFAULT 'home' CHECK (type IN ('home', 'work', 'other')),
    
    -- Contact details
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    
    -- Location details
    pincode VARCHAR(6) NOT NULL,
    state VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    locality VARCHAR(100) NOT NULL,        -- Area/Colony/Street
    building_no VARCHAR(100) NOT NULL,   -- Building/Flat/House Number
    floor VARCHAR(20),                   -- Floor (optional)
    landmark VARCHAR(100),                 -- Nearest landmark (optional)
    
    -- Geolocation (optional, for future use)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Flags
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_pincode ON user_addresses(pincode);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_addresses_active ON user_addresses(user_id, is_active) WHERE is_active = true;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_addresses_updated_at ON user_addresses;
CREATE TRIGGER trigger_addresses_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_addresses_updated_at();

-- Trigger to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE user_addresses 
        SET is_default = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_default_address ON user_addresses;
CREATE TRIGGER trigger_single_default_address
    BEFORE INSERT OR UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();
