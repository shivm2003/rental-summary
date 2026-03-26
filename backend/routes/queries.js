const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const auth = require('../middleware/auth');

router.post('/', auth, queryController.createQuery);

module.exports = router;
