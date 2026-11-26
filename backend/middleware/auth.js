const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');

const JWT_SECRET = process.env.JWT_SECRET || 'picksy_super_secret_jwt_key_2026';

const isMongoReady = () => mongoose.connection.readyState === 1 || getIsConnected();

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (isMongoReady()) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        req.user = await inMemoryStore.users.findById(decoded.id);
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User no longer exists.' });
      }

      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  protect,
  signToken,
};

