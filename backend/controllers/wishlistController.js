const User = require('../models/User');
const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');
const { calculateDecisionMetrics } = require('../utils/decisionEngine');

// @desc    Get user's wishlist items
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let productIds = [];

    if (getIsConnected()) {
      const user = await User.findById(userId).populate('wishlist');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      const enhanced = (user.wishlist || []).map((p) => {
        const prodObj = p.toObject ? p.toObject() : p;
        return {
          ...prodObj,
          decision: calculateDecisionMetrics(prodObj),
        };
      });

      return res.json({ success: true, count: enhanced.length, wishlist: enhanced });
    } else {
      const user = await inMemoryStore.users.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      productIds = user.wishlist || [];
      const products = await Promise.all(
        productIds.map((id) => inMemoryStore.products.findById(id))
      );
      
      const validProducts = products.filter(Boolean).map((p) => ({
        ...p,
        decision: calculateDecisionMetrics(p),
      }));

      return res.json({ success: true, count: validProducts.length, wishlist: validProducts });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;

    if (getIsConnected()) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (!user.wishlist.includes(productId)) {
        user.wishlist.push(productId);
        await user.save();
      }
      return res.json({ success: true, message: 'Product added to wishlist', wishlist: user.wishlist });
    } else {
      const updatedList = await inMemoryStore.users.updateWishlist(userId, productId, 'add');
      return res.json({ success: true, message: 'Product added to wishlist', wishlist: updatedList });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;

    if (getIsConnected()) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
      await user.save();

      return res.json({ success: true, message: 'Product removed from wishlist', wishlist: user.wishlist });
    } else {
      const updatedList = await inMemoryStore.users.updateWishlist(userId, productId, 'remove');
      return res.json({ success: true, message: 'Product removed from wishlist', wishlist: updatedList });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};

