// services/images.js - Enhanced S3 Image Management

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const S3_BUCKET_URL = import.meta.env.VITE_S3_BUCKET_URL || 'https://your-bucket.s3.amazonaws.com';

/**
 * S3 Folder Structure:
 * - categories/{category-slug}/{year}/{month}/{filename}
 * - hero-banners/{type}/{year}/{filename}
 * - products/{userId}/{listingId}/{filename}
 * - defaults/{type}-placeholder.jpg
 */

/**
 * Generate S3 path for category image
 */
export const generateCategoryPath = (categorySlug, filename) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID().split('-')[0];
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `categories/${categorySlug}/${year}/${month}/${uuid}-${cleanFilename}`;
};

/**
 * Generate S3 path for hero banner
 */
export const generateHeroBannerPath = (type = 'desktop', filename) => {
  const now = new Date();
  const year = now.getFullYear();
  const uuid = crypto.randomUUID().split('-')[0];
  
  return `hero-banners/${type}/${year}/${uuid}-${filename}`;
};

/**
 * Get image URL from photo object with S3 priority
 * Handles fullUrl, base64Preview, and generates S3 URL if needed
 */
export const getImageUrl = (photo, type = 'category') => {
  if (!photo) return getDefaultImage(type);
  
  // Priority 1: Direct S3 fullUrl from backend
  if (photo.fullUrl) {
    return photo.fullUrl.trim();
  }
  
  // Priority 2: Base64 preview (for immediate display)
  if (photo.base64Preview) {
    return photo.base64Preview;
  }
  
  // Priority 3: Construct S3 URL from path components
  if (photo.s3Key) {
    return `${S3_BUCKET_URL}/${photo.s3Key}`;
  }
  
  // Priority 4: Legacy local path support
  if (photo.photo_path && photo.storage_type === 'local') {
    return `${API_BASE_URL}/${photo.photo_path}`;
  }
  
  // Priority 5: Direct URL fallback
  if (photo.image_url) {
    return photo.image_url.trim();
  }
  
  // Final fallback
  return getDefaultImage(type);
};

/**
 * Get main image for a listing/card view
 * Returns placeholder if no images available
 */
export const getMainImage = (photos, type = 'product') => {
  if (!photos || photos.length === 0) {
    return getDefaultImage(type);
  }
  
  const url = getImageUrl(photos[0], type);
  return url || getDefaultImage(type);
};

/**
 * Get all image URLs for a gallery
 */
export const getGalleryImages = (photos, type = 'product') => {
  if (!photos || photos.length === 0) return [];
  return photos.map(photo => getImageUrl(photo, type)).filter(Boolean);
};

/**
 * Get category image with smart fallback
 * Checks S3 folder first, then returns default
 */
export const getCategoryImage = (category) => {
  if (!category) return getDefaultImage('category');
  
  // If category has S3 image
  if (category.image_url && !category.image_url.includes('placeholder')) {
    return category.image_url.trim();
  }
  
  // If category has icon, use it as fallback
  if (category.icon) {
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(category.icon)}&bg=f0f9ff&color=0ea5e9`;
  }
  
  // Check if there's a category-specific default in S3
  if (category.slug) {
    return `${S3_BUCKET_URL}/defaults/category-${category.slug}.jpg`;
  }
  
  // Global default
  return getDefaultImage('category');
};

/**
 * Get default placeholder images
 */
export const getDefaultImage = (type) => {
  const defaults = {
    category: `${S3_BUCKET_URL}/defaults/category-placeholder.jpg`,
    product: `${S3_BUCKET_URL}/defaults/product-placeholder.jpg`,
    hero: `${S3_BUCKET_URL}/defaults/hero-placeholder.jpg`,
    user: `${S3_BUCKET_URL}/defaults/user-placeholder.jpg`
  };
  
  return defaults[type] || defaults.product;
};

/**
 * Upload image to S3 with proper folder structure
 * Uses pre-signed URL from backend
 */
export const uploadToS3 = async (file, path, onProgress) => {
  try {
    // 1. Get pre-signed URL from backend
    const { data: { uploadUrl, publicUrl } } = await fetch(`${API_BASE_URL}/api/upload/presigned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        path: path // S3 folder path
      })
    }).then(r => r.json());

    // 2. Upload directly to S3
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    // 3. Return public URL
    return publicUrl;
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw new Error('Failed to upload image to S3');
  }
};

/**
 * Delete image from S3
 */
export const deleteFromS3 = async (s3Key) => {
  try {
    await fetch(`${API_BASE_URL}/api/upload/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key })
    });
    return true;
  } catch (error) {
    console.error('S3 delete failed:', error);
    return false;
  }
};

/**
 * Check if image exists in S3 (for validation)
 */
export const checkImageExists = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Legacy exports for backward compatibility
export const getProductImage = getMainImage;
export const getUnsplashImage = async () => null; // Disabled - using S3 only