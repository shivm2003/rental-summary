const pool = require('../config/database');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const multer = require('multer');
const path = require('path');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only images allowed'));
  }
});

// Single image upload middleware (for direct upload fallback)
exports.uploadMiddleware = upload.single('image');

// ============================================
// NEW: Get pre-signed URL for banner image upload
// POST /api/hero/upload-url
// ============================================
exports.getUploadUrl = async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ message: 'filename and contentType required' });
    }

    const { s3Client } = require('../utils/s3');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `hero-banners/${Date.now()}-${Math.round(Math.random() * 1E9)}-${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read'
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

    res.json({ success: true, uploadUrl, publicUrl, key });
  } catch (error) {
    console.error('Hero upload-url error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Get active banners (public)
// ============================================
exports.getActiveBanners = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT hb.*, c.name as category_name, c.slug as category_slug
       FROM hero_banners hb
       LEFT JOIN categories c ON hb.category_id = c.id
       WHERE hb.is_active = true 
       AND (hb.start_date IS NULL OR hb.start_date <= CURRENT_DATE)
       AND (hb.end_date IS NULL OR hb.end_date >= CURRENT_DATE)
       ORDER BY hb.display_order ASC`
    );
    res.json({ banners: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Get all banners (admin)
// ============================================
exports.getAllBanners = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT hb.*, c.name as category_name
       FROM hero_banners hb
       LEFT JOIN categories c ON hb.category_id = c.id
       ORDER BY hb.display_order ASC, hb.created_at DESC`
    );
    res.json({ banners: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Get single banner (admin)
// ============================================
exports.getBanner = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT hb.*, c.name as category_name
       FROM hero_banners hb
       LEFT JOIN categories c ON hb.category_id = c.id
       WHERE hb.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Create banner
// Accepts image_url (from pre-signed upload) OR direct file upload
// ============================================
exports.createBanner = async (req, res) => {
  try {
    const {
      title, subtitle, description, category_id,
      button_text, button_link, display_order,
      start_date, end_date, is_active,
      image_url // sent from frontend after S3 pre-signed upload
    } = req.body;

    // Use pre-signed URL result OR direct file upload
    let imageUrl = image_url || null;

    if (!imageUrl && req.file) {
      imageUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        'hero-banners',
        req.file.mimetype
      );
    }

    if (!imageUrl) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO hero_banners 
       (title, subtitle, description, image_url, mobile_image_url, category_id,
        button_text, button_link, display_order, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        title, subtitle || null, description || null,
        imageUrl,
        imageUrl, // use same image for mobile (single image approach)
        category_id || null,
        button_text || 'Explore Now',
        button_link || '/products',
        display_order || 0,
        start_date || null,
        end_date || null,
        is_active !== false && is_active !== 'false'
      ]
    );

    res.status(201).json({ message: 'Banner created', banner: rows[0] });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Update banner
// ============================================
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, subtitle, description, category_id,
      button_text, button_link, display_order,
      start_date, end_date, is_active,
      image_url // from pre-signed upload
    } = req.body;

    const { rows: [existing] } = await pool.query(
      'SELECT * FROM hero_banners WHERE id = $1',
      [id]
    );

    if (!existing) return res.status(404).json({ message: 'Not found' });

    let imageUrl = existing.image_url;

    // New image from pre-signed S3 upload
    if (image_url && image_url !== existing.image_url) {
      // Delete old image from S3 if it exists
      if (existing.image_url) await deleteFromS3(existing.image_url).catch(() => {});
      imageUrl = image_url;
    }

    // New image from direct file upload
    if (req.file) {
      if (existing.image_url) await deleteFromS3(existing.image_url).catch(() => {});
      imageUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        'hero-banners',
        req.file.mimetype
      );
    }

    const { rows } = await pool.query(
      `UPDATE hero_banners 
       SET title = $1, subtitle = $2, description = $3,
           image_url = $4, mobile_image_url = $5,
           category_id = $6, button_text = $7, button_link = $8,
           display_order = $9, start_date = $10, end_date = $11,
           is_active = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 RETURNING *`,
      [
        title || existing.title,
        subtitle !== undefined ? subtitle : existing.subtitle,
        description !== undefined ? description : existing.description,
        imageUrl,
        imageUrl, // same image for mobile
        category_id !== undefined ? (category_id || null) : existing.category_id,
        button_text || existing.button_text,
        button_link || existing.button_link,
        display_order !== undefined ? display_order : existing.display_order,
        start_date || existing.start_date,
        end_date || existing.end_date,
        is_active !== undefined ? (is_active !== false && is_active !== 'false') : existing.is_active,
        id
      ]
    );

    res.json({ message: 'Banner updated', banner: rows[0] });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Delete banner
// ============================================
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'SELECT image_url, mobile_image_url FROM hero_banners WHERE id = $1',
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Not found' });

    if (rows[0].image_url) await deleteFromS3(rows[0].image_url).catch(() => {});
    if (rows[0].mobile_image_url && rows[0].mobile_image_url !== rows[0].image_url) {
      await deleteFromS3(rows[0].mobile_image_url).catch(() => {});
    }

    await pool.query('DELETE FROM hero_banners WHERE id = $1', [id]);

    res.json({ message: 'Banner deleted' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ message: error.message });
  }
};