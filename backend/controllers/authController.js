const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');
const bcrypt = require('bcryptjs');

// Regex for basic email format validation
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanName = name.trim();

    if (getIsConnected()) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = await User.create({ name: cleanName, email: cleanEmail, password });
      const token = signToken(user._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          wishlist: user.wishlist || [],
        },
      });
    } else {
      // In-Memory Mode
      const existing = await inMemoryStore.users.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = await inMemoryStore.users.create({ name: cleanName, email: cleanEmail, password });
      const token = signToken(user._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          wishlist: user.wishlist || [],
        },
      });
    }
  } catch (error) {
    // Handle Mongoose duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (getIsConnected()) {
      const user = await User.findOne({ email: cleanEmail }).select('+password');

      if (!user) {
        return res.status(401).json({ success: false, message: 'No account found with this email address.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
      }

      const token = signToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          wishlist: user.wishlist || [],
        },
      });
    } else {
      // In-Memory Mode
      const user = await inMemoryStore.users.findOne({ email: cleanEmail });

      if (!user) {
        return res.status(401).json({ success: false, message: 'No account found with this email address.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
      }

      const token = signToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          wishlist: user.wishlist || [],
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
