const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  startChat,
  getChat,
  postVisitorMessage,
} = require('../controllers/chat.controller');

const router = express.Router();

/** Attach user if Bearer token valid; never block guests */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.status === 'active') req.user = user;
    }
  } catch {
    /* guest */
  }
  next();
};

router.post('/start', optionalAuth, startChat);
router.get('/:id', getChat);
router.post('/:id/messages', postVisitorMessage);

module.exports = router;
