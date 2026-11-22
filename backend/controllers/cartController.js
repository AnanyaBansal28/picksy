const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');

// Platform default delivery and handling configurations
const PLATFORM_CONFIG = {
  Blinkit: { defaultDelivery: 15, freeThreshold: 249, handling: 4, etaMins: 10 },
  Zepto: { defaultDelivery: 16, freeThreshold: 199, handling: 5, etaMins: 9 },
  Instamart: { defaultDelivery: 20, freeThreshold: 299, handling: 3, etaMins: 14 },
};

// @desc    Optimize Quick-Commerce unified cart across Blinkit, Zepto, Swiggy Instamart
// @route   POST /api/cart/optimize
// @access  Public
const optimizeCart = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required.' });
    }

    // Fetch product details
    const productIds = items.map((i) => i.productId);
    let products = [];

    if (getIsConnected()) {
      products = await Product.find({ _id: { $in: productIds } }).lean();
    } else {
      products = await Promise.all(productIds.map((id) => inMemoryStore.products.findById(id)));
      products = products.filter(Boolean);
    }

    // Map cart items with full product details
    const cartItems = items.map((cartItem) => {
      const product = products.find((p) => (p._id || p.id).toString() === cartItem.productId.toString());
      return {
        product,
        quantity: Math.max(1, parseInt(cartItem.quantity, 10) || 1),
      };
    }).filter((ci) => ci.product !== undefined);

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products found in cart.' });
    }

    const platforms = ['Blinkit', 'Zepto', 'Instamart'];

    // 1. Calculate Single-Platform Cart Totals
    const singlePlatformResults = platforms.map((platformName) => {
      const config = PLATFORM_CONFIG[platformName] || { defaultDelivery: 20, freeThreshold: 299, handling: 4, etaMins: 12 };
      let itemSubtotal = 0;
      let missingItems = 0;
      const itemBreakdown = [];

      for (const item of cartItems) {
        const listing = item.product.platformListings?.find((l) => l.platform === platformName);
        if (listing && listing.inStock) {
          const itemCost = listing.basePrice * item.quantity;
          itemSubtotal += itemCost;
          itemBreakdown.push({
            productId: item.product._id || item.product.id,
            title: item.product.title,
            unitPrice: listing.basePrice,
            quantity: item.quantity,
            totalPrice: itemCost,
            inStock: true,
          });
        } else {
          missingItems += 1;
          itemBreakdown.push({
            productId: item.product._id || item.product.id,
            title: item.product.title,
            unitPrice: 0,
            quantity: item.quantity,
            totalPrice: 0,
            inStock: false,
          });
        }
      }

      const freeDeliveryUnlocked = itemSubtotal >= config.freeThreshold;
      const deliveryFee = freeDeliveryUnlocked ? 0 : config.defaultDelivery;
      const handlingFee = config.handling;
      const netTotal = itemSubtotal + deliveryFee + handlingFee;

      return {
        platform: platformName,
        itemSubtotal,
        deliveryFee,
        handlingFee,
        netTotal,
        freeDeliveryUnlocked,
        freeDeliveryThreshold: config.freeThreshold,
        amountNeededForFreeDelivery: Math.max(0, config.freeThreshold - itemSubtotal),
        eta: `${config.etaMins} Mins`,
        etaMinutes: config.etaMins,
        allInStock: missingItems === 0,
        missingItemsCount: missingItems,
        itemBreakdown,
      };
    });

    // 2. Calculate Split-Cart Option (Maximizing per-item discounts)
    // For each item, find the platform with lowest basePrice that is in stock
    const itemSplitAllocation = [];
    const platformBuckets = { Blinkit: [], Zepto: [], Instamart: [] };

    for (const item of cartItems) {
      let cheapestListing = null;
      let minPrice = Infinity;

      for (const listing of item.product.platformListings || []) {
        if (platforms.includes(listing.platform) && listing.inStock) {
          if (listing.basePrice < minPrice) {
            minPrice = listing.basePrice;
            cheapestListing = listing;
          }
        }
      }

      if (cheapestListing) {
        const allocatedPlatform = cheapestListing.platform;
        const lineTotal = cheapestListing.basePrice * item.quantity;
        
        platformBuckets[allocatedPlatform].push({
          productId: item.product._id || item.product.id,
          title: item.product.title,
          unitPrice: cheapestListing.basePrice,
          quantity: item.quantity,
          lineTotal,
        });

        itemSplitAllocation.push({
          product: item.product.title,
          chosenPlatform: allocatedPlatform,
          price: cheapestListing.basePrice,
          quantity: item.quantity,
          lineTotal,
        });
      }
    }

    // Calculate split cart totals across utilized platforms
    let splitItemSubtotal = 0;
    let splitDeliveryFees = 0;
    let splitHandlingFees = 0;
    const splitPlatformsUsed = [];

    for (const platformName of platforms) {
      const bucket = platformBuckets[platformName];
      if (bucket && bucket.length > 0) {
        const bucketSubtotal = bucket.reduce((sum, i) => sum + i.lineTotal, 0);
        const config = PLATFORM_CONFIG[platformName];
        const unlockedFree = bucketSubtotal >= config.freeThreshold;
        const delivery = unlockedFree ? 0 : config.defaultDelivery;
        const handling = config.handling;

        splitItemSubtotal += bucketSubtotal;
        splitDeliveryFees += delivery;
        splitHandlingFees += handling;

        splitPlatformsUsed.push({
          platform: platformName,
          itemsCount: bucket.length,
          subtotal: bucketSubtotal,
          deliveryFee: delivery,
          handlingFee: handling,
          freeDeliveryUnlocked: unlockedFree,
          freeDeliveryThreshold: config.freeThreshold,
          eta: `${config.etaMins} Mins`,
          items: bucket,
        });
      }
    }

    const splitNetTotal = splitItemSubtotal + splitDeliveryFees + splitHandlingFees;

    // 3. Identify Cheapest and Fastest
    const fullyStockedSingle = singlePlatformResults.filter((p) => p.allInStock);
    const candidateSingle = fullyStockedSingle.length > 0 ? fullyStockedSingle : singlePlatformResults;
    
    // Sort by netTotal ascending
    const sortedByPrice = [...candidateSingle].sort((a, b) => a.netTotal - b.netTotal);
    const cheapestSingle = sortedByPrice[0];

    // Sort by ETA ascending
    const sortedByEta = [...candidateSingle].sort((a, b) => a.etaMinutes - b.etaMinutes);
    const fastestSingle = sortedByEta[0];

    // Determine if Split Cart is genuinely worthwhile
    const singleVsSplitDiff = cheapestSingle.netTotal - splitNetTotal;
    const isSplitCheaper = singleVsSplitDiff > 5 && splitPlatformsUsed.length > 1;

    let splitRecommendationNote = '';
    if (isSplitCheaper) {
      splitRecommendationNote = `Split order saves ₹${singleVsSplitDiff} by sourcing individual groceries at each app's lowest promotional price.`;
    } else if (splitPlatformsUsed.length > 1) {
      splitRecommendationNote = `Single cart on ${cheapestSingle.platform} is smarter. Splitting across multiple apps triggers redundant delivery/handling fees (₹${splitDeliveryFees + splitHandlingFees}) that outweigh individual item discounts.`;
    } else {
      splitRecommendationNote = `All items are already cheapest on ${cheapestSingle.platform}. Single cart is optimal.`;
    }

    res.json({
      success: true,
      cartCount: cartItems.length,
      singlePlatformOptions: singlePlatformResults,
      cheapestOption: {
        platform: isSplitCheaper ? 'Split Cart Optimization' : cheapestSingle.platform,
        netTotal: isSplitCheaper ? splitNetTotal : cheapestSingle.netTotal,
        savingsVsWorst: Math.max(0, sortedByPrice[sortedByPrice.length - 1].netTotal - (isSplitCheaper ? splitNetTotal : cheapestSingle.netTotal)),
        isSplit: isSplitCheaper,
      },
      fastestOption: {
        platform: fastestSingle.platform,
        eta: fastestSingle.eta,
        netTotal: fastestSingle.netTotal,
      },
      splitCartAnalysis: {
        isCheaper: isSplitCheaper,
        netTotal: splitNetTotal,
        savings: Math.max(0, singleVsSplitDiff),
        itemSubtotal: splitItemSubtotal,
        totalDeliveryFees: splitDeliveryFees,
        totalHandlingFees: splitHandlingFees,
        platformsUsedCount: splitPlatformsUsed.length,
        platformsUsed: splitPlatformsUsed,
        recommendationNote: splitRecommendationNote,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  optimizeCart,
};
