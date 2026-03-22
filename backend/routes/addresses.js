/* backend/routes/addresses.js */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAddresses,
    getAddress,
    getDefaultAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    validatePincode,
    getAddressCount
} = require('../controllers/addressController');

// 1. PUBLIC: Pincode validation (no auth required)
router.get('/pincode/:pincode', validatePincode);

// 2. PROTECTED: Specific static routes
router.get('/count', auth, getAddressCount);
router.get('/default', auth, getDefaultAddress);

// 3. PROTECTED: Root routes
router.get('/', auth, getAddresses);
router.post('/', auth, createAddress);

// 4. PROTECTED: Parameterized routes (MUST be last)
router.get('/:id', auth, getAddress);
router.put('/:id', auth, updateAddress);
router.patch('/:id/default', auth, setDefaultAddress);
router.delete('/:id', auth, deleteAddress);

module.exports = router;