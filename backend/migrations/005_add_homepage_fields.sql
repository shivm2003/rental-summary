-- Add homepage control fields to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon_emoji VARCHAR(10) DEFAULT '📦',
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS home_display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS banner_image_url VARCHAR(500);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_categories_homepage 
ON categories(show_on_homepage, home_display_order) 
WHERE is_active = true;

-- Update existing categories
UPDATE categories SET show_on_homepage = true, home_display_order = display_order 
WHERE show_on_homepage IS NULL;

-- Set default emojis based on category names
UPDATE categories SET icon_emoji = '📱' WHERE name ILIKE '%electronic%';
UPDATE categories SET icon_emoji = '🚗' WHERE name ILIKE '%vehicle%' OR name ILIKE '%auto%';
UPDATE categories SET icon_emoji = '👕' WHERE name ILIKE '%cloth%' OR name ILIKE '%fashion%';
UPDATE categories SET icon_emoji = '🏠' WHERE name ILIKE '%home%' OR name ILIKE '%garden%';
UPDATE categories SET icon_emoji = '⚽' WHERE name ILIKE '%sport%';
UPDATE categories SET icon_emoji = '📷' WHERE name ILIKE '%camera%' OR name ILIKE '%photo%';
UPDATE categories SET icon_emoji = '🎸' WHERE name ILIKE '%music%';
UPDATE categories SET icon_emoji = '📺' WHERE name ILIKE '%appliance%';
UPDATE categories SET icon_emoji = '🍳' WHERE name ILIKE '%kitchen%';
UPDATE categories SET icon_emoji = '📚' WHERE name ILIKE '%book%';
UPDATE categories SET icon_emoji = '🍼' WHERE name ILIKE '%baby%' OR name ILIKE '%kid%';
UPDATE categories SET icon_emoji = '🔧' WHERE name ILIKE '%tool%';
UPDATE categories SET icon_emoji = '⌚' WHERE name ILIKE '%watch%';
UPDATE categories SET icon_emoji = '💊' WHERE name ILIKE '%health%';
UPDATE categories SET icon_emoji = '🎉' WHERE name ILIKE '%event%' OR name ILIKE '%party%';
UPDATE categories SET icon_emoji = '📦' WHERE icon_emoji IS NULL;