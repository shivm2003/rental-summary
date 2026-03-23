const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/rooms', chatController.getRooms);
router.post('/rooms', chatController.createRoom);
router.get('/rooms/:roomId/messages', chatController.getRoomMessages);
router.post('/rooms/:roomId/messages', chatController.sendMessage);

module.exports = router;
