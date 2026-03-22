-- Create listings table (unchanged)
CREATE TABLE IF NOT EXISTS listings (
    id BIGSERIAL PRIMARY KEY,
    lender_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    location VARCHAR(150) NOT NULL,
    security_deposit NUMERIC(10,2) DEFAULT 0,
    rental_price_per_day NUMERIC(10,2) NOT NULL,
    availability JSONB NOT NULL,
    terms_and_conditions VARCHAR(300),
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2),
    discount_start_date DATE,
    discount_end_date DATE,
    promo_code VARCHAR(20),
    display_tagline VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create flexible photos table (supports local & S3)
CREATE TABLE IF NOT EXISTS listing_photos (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    storage_type VARCHAR(20) DEFAULT 'local' CHECK (storage_type IN ('local', 's3')),
    photo_path VARCHAR(255) NOT NULL,           -- local path or S3 key
    base64_preview TEXT,                        -- base64 thumbnail for instant display
    full_url VARCHAR(500),                      -- complete URL (local or S3)
    metadata JSONB DEFAULT '{}'::jsonb,         -- {size: 1024, mime: "image/jpeg", width: 800, height: 600}
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_listings_lender_id ON listings(lender_id);
CREATE INDEX idx_listings_category ON listings(category) WHERE status = 'active';
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_listing_photos_listing_id ON listing_photos(listing_id);
CREATE INDEX idx_listing_photos_storage ON listing_photos(storage_type);

-- Auto-update timestamp trigger for listings
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listings_updated_at();