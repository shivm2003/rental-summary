/* backend/routes/products.js */

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const pool    = require('../config/database');

const {
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getAllListings,
  getListing,
  getPincodeInfo,
  getLocationGroups,
  uploadMiddleware,
  addReview,
  getReviews
} = require('../controllers/productController');

// ============================================
// Public routes
// ============================================

// Listings
router.get('/',             getAllListings);
router.get('/my/listings',  auth, getMyListings);

/* ---------- GET /api/products/user/reviews ---------- */
router.get('/user/reviews', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, p.title as product_name 
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.uid]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id',          getListing);
router.get('/:id/reviews',  getReviews);

// Protected routes (require auth) are below, we'll add the POST review here
router.post('/:id/reviews', auth, addReview);

// Image serving (base64 preview, S3 redirect, or legacy local file)
router.get('/image/:photoId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT storage_type, photo_path, full_url, base64_preview FROM listing_photos WHERE id = $1',
      [req.params.photoId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const image = rows[0];

    // Return base64 thumbnail if requested
    if (req.query.format === 'base64' && image.base64_preview) {
      return res.json({ base64: image.base64_preview });
    }

    // S3: redirect to full URL
    if (image.storage_type === 's3' && image.full_url) {
      return res.redirect(image.full_url);
    }

    // Legacy: serve local file
    const path = require('path');
    const fs   = require('fs');
    const filePath = path.join(__dirname, '../../', image.photo_path);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // Last resort: decode and send base64
    if (image.base64_preview) {
      const base64Data = image.base64_preview.replace(/^data:image\/\w+;base64,/, '');
      const buffer     = Buffer.from(base64Data, 'base64');
      res.set('Content-Type', 'image/jpeg');
      return res.send(buffer);
    }

    res.status(404).json({ success: false, message: 'Image not found' });
  } catch (err) {
    console.error('Image serving error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// Location Groups lookup
// GET /api/products/locations
// ============================================
router.get('/locations', getLocationGroups);

// ============================================
// Pincode lookup (used by frontend auto-fill)
// GET /api/pincode/:pincode
// ============================================
router.get('/pincode/:pincode', getPincodeInfo);

// ============================================
// Protected routes (require auth)
// ============================================

// Create listing (with file upload)
router.post('/list', auth, uploadMiddleware, createListing);

// Update listing (with optional file upload)
router.put('/:id', auth, uploadMiddleware, updateListing);

// Delete listing
router.delete('/:id', auth, deleteListing);

module.exports = router;