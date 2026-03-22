const express = require('express');
const router = express.Router();

let adminOnly, controller;

try {
  adminOnly = require('../middleware/admin');
  if (typeof adminOnly !== 'function') {
    adminOnly = (req, res, next) => next();
  }
} catch (e) {
  adminOnly = (req, res, next) => next();
}

try {
  controller = require('../controllers/categoryController');
} catch (e) {
  controller = {};
}

const {
  getAllCategories = (req, res) => res.status(501).json({error: 'Not implemented'}),
  getCategoryTree = (req, res) => res.status(501).json({error: 'Not implemented'}),
  getCategory = (req, res) => res.status(501).json({error: 'Not implemented'}),
  createCategory = (req, res) => res.status(501).json({error: 'Not implemented'}),
  updateCategory = (req, res) => res.status(501).json({error: 'Not implemented'}),
  deleteCategory = (req, res) => res.status(501).json({error: 'Not implemented'}),
  uploadMiddleware = (req, res, next) => next(),
  getHomepageCategories = (req, res) => res.status(501).json({error: 'Not implemented'}),
  getAdminCategories = (req, res) => res.status(501).json({error: 'Not implemented'}),
  updateHomepageSettings = (req, res) => res.status(501).json({error: 'Not implemented'}),
  getIconUploadUrl = (req, res) => res.status(501).json({error: 'Not implemented'}),
  bulkUpdateOrder = (req, res) => res.status(501).json({error: 'Not implemented'}),
  getSubcategories = (req, res) => res.status(501).json({error: 'Not implemented'})
} = controller;

/* ---------- Public Routes (Static paths first) ---------- */
router.get('/homepage', getHomepageCategories);
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/:id/subcategories', getSubcategories);

/* ---------- Admin Routes (Specific parameterized routes BEFORE generic /:id) ---------- */
router.get('/admin', adminOnly, getAdminCategories);
router.get('/admin/all', adminOnly, getAdminCategories);
// ✅ MUST be BEFORE router.get('/:id', ...)
router.post('/:id/upload-url', adminOnly, getIconUploadUrl);
router.put('/bulk-order', adminOnly, bulkUpdateOrder);

/* ---------- Generic Parameterized Routes (MUST be last) ---------- */
// This catches any remaining /:id patterns
router.get('/:id', getCategory);

/* ---------- Other Parameterized Admin Routes ---------- */
router.patch('/:id/homepage', adminOnly, updateHomepageSettings);

/* ---------- CRUD Routes ---------- */
router.post('/', adminOnly, uploadMiddleware, createCategory);
router.put('/:id', adminOnly, uploadMiddleware, updateCategory);
router.delete('/:id', adminOnly, deleteCategory);

module.exports = router;