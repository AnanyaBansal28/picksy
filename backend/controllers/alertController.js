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
            isTriggered: a.status === 'triggered' || (decision ? decision.cheapestPlatform.netPayablePrice <= a.targetPrice : false),
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
            isTriggered: a.status === 'triggered' || (decision ? decision.cheapestPlatform.netPayablePrice <= a.targetPrice : false),
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

// @desc    Simulate a price drop below user target price to trigger live notifications
// @route   POST /api/alerts/simulate-drop
// @access  Private
const simulateDrop = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { alertId, productId } = req.body;

    let alert = null;
    let product = null;

    if (getIsConnected()) {
      if (alertId) {
        alert = await PriceAlert.findOne({ _id: alertId, userId });
      } else if (productId) {
        alert = await PriceAlert.findOne({ productId, userId, status: 'active' });
      } else {
        alert = await PriceAlert.findOne({ userId, status: 'active' }).sort({ createdAt: -1 });
      }

      if (!alert) {
        return res.status(404).json({ success: false, message: 'No active price alert found to simulate.' });
      }

      product = await Product.findById(alert.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Associated product not found.' });
      }

      // Drop price 6% below user's target price
      const droppedPrice = Math.max(1, Math.round(alert.targetPrice * 0.94));

      if (product.platformListings && product.platformListings.length > 0) {
        product.platformListings[0].basePrice = droppedPrice;
      }
      product.historicalPrices.push({
        date: new Date().toISOString().split('T')[0],
        price: droppedPrice,
        note: '⚡ Flash Sale Drop',
      });
      await product.save();

      alert.status = 'triggered';
      alert.notifiedAt = new Date();
      await alert.save();

      return res.json({
        success: true,
        message: `⚡ Sale Drop Triggered! ${product.title} price dropped to ₹${droppedPrice.toLocaleString('en-IN')}`,
        alert,
        droppedPrice,
        notification: {
          id: alert._id,
          productId: product._id,
          title: `Price Drop Alert: ${product.title}`,
          message: `Dropped to ₹${droppedPrice.toLocaleString('en-IN')} (Your target was ₹${alert.targetPrice.toLocaleString('en-IN')})`,
          platform: product.platformListings?.[0]?.platform || 'Flipkart',
          droppedPrice,
          targetPrice: alert.targetPrice,
          image: product.image,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      });
    } else {
      // In-Memory Mode
      const userAlerts = await inMemoryStore.alerts.find({ userId });
      if (alertId) {
        alert = userAlerts.find((a) => (a._id || a.id) === alertId);
      } else if (productId) {
        alert = userAlerts.find((a) => (a.productId?._id || a.productId?.id || a.productId) === productId);
      } else {
        alert = userAlerts.find((a) => a.status === 'active') || userAlerts[0];
      }

      if (!alert) {
        return res.status(404).json({ success: false, message: 'No price alert found to simulate.' });
      }

      const prodId = alert.productId?._id || alert.productId?.id || alert.productId;
      product = await inMemoryStore.products.findById(prodId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      const droppedPrice = Math.max(1, Math.round(alert.targetPrice * 0.94));
      if (product.platformListings && product.platformListings.length > 0) {
        product.platformListings[0].basePrice = droppedPrice;
      }
      product.historicalPrices.push({
        date: new Date().toISOString().split('T')[0],
        price: droppedPrice,
        note: '⚡ Flash Sale Drop',
      });

      alert.status = 'triggered';
      alert.notifiedAt = new Date().toISOString();

      return res.json({
        success: true,
        message: `⚡ Sale Drop Triggered! ${product.title} price dropped to ₹${droppedPrice.toLocaleString('en-IN')}`,
        alert,
        droppedPrice,
        notification: {
          id: alert._id || alert.id,
          productId: product._id || product.id,
          title: `Price Drop Alert: ${product.title}`,
          message: `Dropped to ₹${droppedPrice.toLocaleString('en-IN')} (Your target was ₹${alert.targetPrice.toLocaleString('en-IN')})`,
          platform: product.platformListings?.[0]?.platform || 'Flipkart',
          droppedPrice,
          targetPrice: alert.targetPrice,
          image: product.image,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a price alert
// @route   DELETE /api/alerts/:id
// @access  Private
const deleteAlert = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (getIsConnected()) {
      const alert = await PriceAlert.findOneAndDelete({ _id: id, userId });
      if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
      return res.json({ success: true, message: 'Price alert removed successfully.' });
    } else {
      await inMemoryStore.alerts.delete(id);
      return res.json({ success: true, message: 'Price alert removed successfully.' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  createAlert,
  simulateDrop,
  deleteAlert,
};
