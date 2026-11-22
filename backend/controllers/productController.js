const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');
const { calculateDecisionMetrics } = require('../utils/decisionEngine');

// @desc    Get all products with filtering, search, sorting & dynamic decision engine data
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { category, subCategory, search, sort, dealFilter } = req.query;

    let products = [];

    if (getIsConnected()) {
      const filter = {};
      if (category) filter.category = category;
      if (subCategory && subCategory !== 'All') filter.subCategory = subCategory;

      if (search && search.trim()) {
        const queryLower = search.trim().toLowerCase();
        const words = queryLower.split(/\s+/).filter(Boolean);

        const isOnlyPhone = words.some((w) => w === 'phone' || w === 'phones' || w === 'iphone' || w === 'smartphone');
        const hasAudioWord = words.some((w) => w.includes('head') || w.includes('ear') || w.includes('audio') || w.includes('sound'));

        if (isOnlyPhone && !hasAudioWord) {
          // Strictly match phones and exclude headphones
          filter.$and = [
            {
              $or: [
                { subCategory: 'Smartphones' },
                { title: { $regex: '\\b(iphone|phone|smartphone|mobile)\\b', $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
              ],
            },
            {
              title: { $not: { $regex: 'headphone', $options: 'i' } },
            },
          ];
        } else {
          // Standard smart matching
          filter.$or = [
            { title: { $regex: search.trim(), $options: 'i' } },
            { brand: { $regex: search.trim(), $options: 'i' } },
            { subCategory: { $regex: search.trim(), $options: 'i' } },
            { tags: { $in: words.map((w) => new RegExp(`^${w}$|${w}`, 'i')) } },
          ];
        }
      }

      products = await Product.find(filter).lean();
    } else {
      products = await inMemoryStore.products.find({
        category,
        subCategory,
        search,
      });
    }

    // Enhance each product with live Decision Engine analysis
    let enhancedProducts = products.map((prod) => {
      const decisionMetrics = calculateDecisionMetrics(prod);
      const lowestNetPrice = decisionMetrics ? decisionMetrics.cheapestPlatform.netPayablePrice : prod.mrp;

      return {
        ...prod,
        decision: decisionMetrics,
        lowestPrice: lowestNetPrice,
      };
    });

    // Filter by Deal Verdict / Score if specified
    if (dealFilter === 'BUY_NOW') {
      enhancedProducts = enhancedProducts.filter((p) => p.decision?.verdict.action === 'BUY NOW');
    } else if (dealFilter === 'EXCEPTIONAL') {
      enhancedProducts = enhancedProducts.filter((p) => p.decision?.realDealScore.score >= 80);
    } else if (dealFilter === 'WAIT') {
      enhancedProducts = enhancedProducts.filter((p) => p.decision?.verdict.action === 'WAIT');
    }

    // Apply Sorting
    if (sort === 'deal_score_desc') {
      enhancedProducts.sort((a, b) => (b.decision?.realDealScore.score || 0) - (a.decision?.realDealScore.score || 0));
    } else if (sort === 'price_asc') {
      enhancedProducts.sort((a, b) => a.lowestPrice - b.lowestPrice);
    } else if (sort === 'price_desc') {
      enhancedProducts.sort((a, b) => b.lowestPrice - a.lowestPrice);
    } else if (sort === 'verdict') {
      const order = { 'BUY NOW': 1, 'FAIR PRICE': 2, 'WAIT': 3 };
      enhancedProducts.sort((a, b) => {
        const aRank = order[a.decision?.verdict.action] || 9;
        const bRank = order[b.decision?.verdict.action] || 9;
        return aRank - bRank;
      });
    }

    res.json({
      success: true,
      count: enhancedProducts.length,
      products: enhancedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID with full Decision Dashboard analysis
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let product = null;

    if (getIsConnected()) {
      product = await Product.findById(id).lean();
    } else {
      product = await inMemoryStore.products.findById(id);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const decisionMetrics = calculateDecisionMetrics(product);

    res.json({
      success: true,
      product: {
        ...product,
        decision: decisionMetrics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured spotlight deals
// @route   GET /api/products/spotlight/deals
// @access  Public
const getSpotlightDeals = async (req, res, next) => {
  try {
    let products = [];
    if (getIsConnected()) {
      products = await Product.find({ category: 'ecommerce' }).lean();
    } else {
      products = await inMemoryStore.products.find({ category: 'ecommerce' });
    }

    const analyzed = products.map((p) => {
      const decision = calculateDecisionMetrics(p);
      return {
        ...p,
        decision,
      };
    });

    analyzed.sort((a, b) => (b.decision?.realDealScore.score || 0) - (a.decision?.realDealScore.score || 0));

    res.json({
      success: true,
      deals: analyzed.slice(0, 4),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getSpotlightDeals,
};
