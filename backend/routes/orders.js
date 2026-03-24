const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Public route to get booked dates for a product
router.get('/product/:id/bookings', orderController.getProductBookings);

const auth = require('../middleware/auth');

// All routes below are protected by auth middleware
router.get('/my-orders', auth, orderController.getMyOrders);
router.post('/', auth, orderController.createOrder);

module.exports = router;
