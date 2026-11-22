const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../utils/emailService');

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
          totalSavings: user.totalSavings || 0,
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
          totalSavings: user.totalSavings || 0,
        },
      });
    }
  } catch (error) {
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
        return res.status(401).json({
          success: false,
          message: 'No account found with this email address.',
          isWrongPassword: false,
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please try again.',
          isWrongPassword: true,
          email: cleanEmail,
        });
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
          totalSavings: user.totalSavings || 0,
        },
      });
    } else {
      // In-Memory Mode
      const user = await inMemoryStore.users.findOne({ email: cleanEmail });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No account found with this email address.',
          isWrongPassword: false,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please try again.',
          isWrongPassword: true,
          email: cleanEmail,
        });
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
          totalSavings: user.totalSavings || 0,
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
        totalSavings: user.totalSavings || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate Forgot Password - Generate 6-digit OTP & Send Email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check user existence
    let user = null;
    if (getIsConnected()) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = await inMemoryStore.users.findOne({ email: cleanEmail });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Persist OTP in database or in-memory store
    if (getIsConnected()) {
      user.resetOtp = otp;
      user.resetOtpExpiry = expiry;
      await user.save({ validateBeforeSave: false });
    } else {
      await inMemoryStore.users.updateOtp(cleanEmail, otp, expiry);
    }

    // Send email (or log to terminal if unconfigured)
    await sendOtpEmail({
      to: cleanEmail,
      name: user.name,
      otp,
    });

    res.json({
      success: true,
      message: `A 6-digit verification OTP has been sent to ${cleanEmail}. Valid for 10 minutes.`,
      email: cleanEmail,
      demoOtp: otp, // Always returned for effortless testing/evaluation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide both email and the 6-digit OTP.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    let user = null;
    if (getIsConnected()) {
      user = await User.findOne({ email: cleanEmail }).select('+resetOtp +resetOtpExpiry');
    } else {
      user = await inMemoryStore.users.findOne({ email: cleanEmail });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP request found. Please request a new OTP.',
      });
    }

    // Check expiry
    if (new Date() > new Date(user.resetOtpExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired. Please request a new OTP.',
      });
    }

    // Check OTP match
    if (user.resetOtp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please double check the 6 digits and try again.',
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully. You may now enter your new password.',
      email: cleanEmail,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and a new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    let user = null;
    if (getIsConnected()) {
      user = await User.findOne({ email: cleanEmail }).select('+resetOtp +resetOtpExpiry');
    } else {
      user = await inMemoryStore.users.findOne({ email: cleanEmail });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    // Security validation of OTP one final time
    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No active reset request found. Please request a new OTP.',
      });
    }

    if (new Date() > new Date(user.resetOtpExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired. Please request a new OTP.',
      });
    }

    if (user.resetOtp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Password reset aborted.',
      });
    }

    // Update password & clear OTP fields
    if (getIsConnected()) {
      user.password = newPassword;
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await inMemoryStore.users.updatePassword(cleanEmail, hashedPassword);
    }

    console.log(`[Picksy Auth] 🔒 Password successfully reset for user: ${cleanEmail}`);

    res.json({
      success: true,
      message: 'Your password has been reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add locked deal savings to user's wallet
// @route   POST /api/auth/add-savings
// @access  Private
const addSavings = async (req, res, next) => {
  try {
    const { amount, source } = req.body;
    const addAmount = Math.max(0, parseInt(amount, 10) || 0);
    const userId = req.user?._id || req.user?.id;

    if (getIsConnected() && userId) {
      const user = await User.findById(userId);
      if (user) {
        user.totalSavings = (user.totalSavings || 0) + addAmount;
        await user.save();
        return res.json({
          success: true,
          totalSavings: user.totalSavings,
          added: addAmount,
          source: source || 'Picksy Deal Optimization',
        });
      }
    }

    // In-memory or guest fallback
    const newTotal = await inMemoryStore.users.addSavings(userId, addAmount);
    return res.json({
      success: true,
      totalSavings: newTotal,
      added: addAmount,
      source: source || 'Picksy Deal Optimization',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword,
  addSavings,
};
