const express = require('express');
const {
  sendMessage,
  getChatHistory
} = require('../controllers/chatController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Apply middleware to all routes
router.use(protect);

router.route('/message').post(sendMessage);
router.route('/history').get(getChatHistory);

module.exports = router;