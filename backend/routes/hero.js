const express = require('express');
const router = express.Router();
const adminOnly = require('../middleware/admin');
const {
  getActiveBanners,
  getAllBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadMiddleware,
  getUploadUrl
} = require('../controllers/heroController');

// ── Public ──────────────────────────────────────
router.get('/active', getActiveBanners);

// ── Admin ────────────────────────────────────────
// IMPORTANT: /upload-url must be before /:id so it isn't caught as an ID param
router.post('/upload-url', adminOnly, getUploadUrl);

router.get('/', adminOnly, getAllBanners);
router.get('/:id', adminOnly, getBanner);
router.post('/', adminOnly, uploadMiddleware, createBanner);
router.put('/:id', adminOnly, uploadMiddleware, updateBanner);
router.delete('/:id', adminOnly, deleteBanner);

module.exports = router;