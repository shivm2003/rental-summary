const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/categories', require('./categories')); // Should exist
router.use('/products', require('./products'));
router.use('/hero', require('./hero'));
router.use('/cart', require('./cart'));
router.use('/user', require('./user'));
router.use('/lender', require('./lender'));
router.use('/pincode', require('./pincode'));

module.exports = router;