-- Migration: Update listings table to use proper category foreign keys
-- Created: 2025-01-XX

-- Step 1: Add new columns for category IDs
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS category_id INTEGER,
ADD COLUMN IF NOT EXISTS subcategory_id INTEGER;

-- Step 2: Add foreign key constraints
ALTER TABLE listings
ADD CONSTRAINT fk_listing_category 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_listing_subcategory 
    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory_id ON listings(subcategory_id);

-- Step 4: Migrate existing data (optional - if you have existing data)
-- This maps old string category names to new IDs
-- UPDATE listings l 
-- SET category_id = c.id 
-- FROM categories c 
-- WHERE l.category = c.name AND c.parent_id IS NULL;

-- Step 5: Drop old column (after data migration is verified)
-- ALTER TABLE listings DROP COLUMN category;

-- Note: Keep old column until frontend is fully migrated, then drop it