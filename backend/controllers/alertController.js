const PriceAlert = require('../models/PriceAlert');
const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');
const { calculateDecisionMetrics } = require('../utils/decisionEngine');

// @desc    Get user's price drop alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getIsConnected()) {
      const alerts = await PriceAlert.find({ userId }).populate('productId').lean();
      
      const enhancedAlerts = alerts.map((a) => {
        if (a.productId) {
          const decision = calculateDecisionMetrics(a.productId);
          return {
            ...a,
            currentPrice: decision ? decision.cheapestPlatform.netPayablePrice : a.currentPriceAtCreation,
            isTriggered: decision ? decision.cheapestPlatform.netPayablePrice <= a.targetPrice : false,
          };
        }
        return a;
      });

      return res.json({ success: true, count: enhancedAlerts.length, alerts: enhancedAlerts });
    } else {
      const alerts = await inMemoryStore.alerts.find({ userId });
      const enhancedAlerts = alerts.map((a) => {
        if (a.productId && a.productId.platformListings) {
          const decision = calculateDecisionMetrics(a.productId);
          return {
            ...a,
            currentPrice: decision ? decision.cheapestPlatform.netPayablePrice : a.currentPriceAtCreation,
            isTriggered: decision ? decision.cheapestPlatform.netPayablePrice <= a.targetPrice : false,
          };
        }
        return a;
      });

      return res.json({ success: true, count: enhancedAlerts.length, alerts: enhancedAlerts });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new price alert
// @route   POST /api/alerts
// @access  Private
const createAlert = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, targetPrice } = req.body;

    if (!productId || !targetPrice) {
      return res.status(400).json({ success: false, message: 'Product ID and Target Price are required.' });
    }

    let product = null;
    if (getIsConnected()) {
      product = await Product.findById(productId);
    } else {
      product = await inMemoryStore.products.findById(productId);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const decision = calculateDecisionMetrics(product);
    const currentPriceAtCreation = decision ? decision.cheapestPlatform.netPayablePrice : product.mrp;

    if (targetPrice >= currentPriceAtCreation) {
      return res.status(400).json({
        success: false,
        message: `Target price (₹${targetPrice}) must be lower than current best price (₹${currentPriceAtCreation}).`,
      });
    }

    if (getIsConnected()) {
      const alert = await PriceAlert.create({
        userId,
        productId,
        targetPrice,
        currentPriceAtCreation,
      });
      return res.status(201).json({ success: true, message: 'Price alert created successfully', alert });
    } else {
      const alert = await inMemoryStore.alerts.create({
        userId,
        productId,
        targetPrice,
        currentPriceAtCreation,
      });
      return res.status(201).json({ success: true, message: 'Price alert created successfully', alert });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/dismiss price alert
// @route   DELETE /api/alerts/:id
// @access  Private
const deleteAlert = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (getIsConnected()) {
      const alert = await PriceAlert.findOneAndDelete({ _id: id, userId });
      if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
      return res.json({ success: true, message: 'Alert removed successfully' });
    } else {
      const removed = await inMemoryStore.alerts.delete(id, userId);
      return res.json({ success: true, message: 'Alert removed successfully' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  createAlert,
  deleteAlert,
};

