const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth'); // or your auth middleware

// ✅ CORRECT: Using the exported functions
router.post('/', authenticate, productController.uploadMiddleware, productController.createListing);
router.get('/', productController.getAllListings);
router.get('/my', authenticate, productController.getMyListings);
router.get('/:id', productController.getListing);
router.put('/:id', authenticate, productController.uploadMiddleware, productController.updateListing);
router.delete('/:id', authenticate, productController.deleteListing);

module.exports = router;