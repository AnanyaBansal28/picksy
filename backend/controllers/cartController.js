const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');

// Platform delivery fee configurations
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

    const cartItems = items
      .map((cartItem) => {
        const product = products.find(
          (p) => (p._id || p.id).toString() === cartItem.productId.toString()
        );
        return {
          product,
          quantity: Math.max(1, parseInt(cartItem.quantity, 10) || 1),
        };
      })
      .filter((ci) => ci.product !== undefined);

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products found in cart.' });
    }

    const platforms = ['Blinkit', 'Zepto', 'Instamart'];

    // 1. Calculate Single-Store Checkouts for Blinkit, Zepto, and Instamart
    const singleStoresMap = {};
    const singleStoresList = [];

    for (const platformName of platforms) {
      const config = PLATFORM_CONFIG[platformName];
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
            brand: item.product.brand,
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
            brand: item.product.brand,
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

      const storeData = {
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

      singleStoresMap[platformName.toLowerCase()] = storeData;
      singleStoresList.push(storeData);
    }

    // 2. Compute Item-Level Split Cart Allocation
    // For each item, allocate to the platform with lowest basePrice
    const splitBuckets = { Blinkit: [], Zepto: [], Instamart: [] };

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
        const platform = cheapestListing.platform;
        const lineTotal = cheapestListing.basePrice * item.quantity;

        splitBuckets[platform].push({
          productId: item.product._id || item.product.id,
          title: item.product.title,
          brand: item.product.brand,
          unitPrice: cheapestListing.basePrice,
          quantity: item.quantity,
          lineTotal,
        });
      }
    }

    // Calculate totals for the split plan
    let splitItemsSubtotal = 0;
    let splitTotalDelivery = 0;
    let splitTotalHandling = 0;
    const splitGroups = [];

    for (const platformName of platforms) {
      const itemsInPlatform = splitBuckets[platformName];
      if (itemsInPlatform && itemsInPlatform.length > 0) {
        const groupSubtotal = itemsInPlatform.reduce((sum, i) => sum + i.lineTotal, 0);
        const config = PLATFORM_CONFIG[platformName];
        const unlockedFree = groupSubtotal >= config.freeThreshold;
        const delivery = unlockedFree ? 0 : config.defaultDelivery;
        const handling = config.handling;

        splitItemsSubtotal += groupSubtotal;
        splitTotalDelivery += delivery;
        splitTotalHandling += handling;

        splitGroups.push({
          platform: platformName,
          items: itemsInPlatform,
          itemsCount: itemsInPlatform.length,
          subtotal: groupSubtotal,
          deliveryFee: delivery,
          handlingFee: handling,
          storeTotal: groupSubtotal + delivery + handling,
          freeDeliveryUnlocked: unlockedFree,
          freeDeliveryThreshold: config.freeThreshold,
          amountNeededForFreeDelivery: Math.max(0, config.freeThreshold - groupSubtotal),
          eta: `${config.etaMins} Mins`,
        });
      }
    }

    const splitNetTotal = splitItemsSubtotal + splitTotalDelivery + splitTotalHandling;

    // 3. Compare Split Cart vs Single Store Options
    const sortedSingleStores = [...singleStoresList].sort((a, b) => a.netTotal - b.netTotal);
    const cheapestSingle = sortedSingleStores[0];
    const mostExpensiveSingle = sortedSingleStores[sortedSingleStores.length - 1];

    const blinkitTotal = singleStoresMap.blinkit.netTotal;
    const zeptoTotal = singleStoresMap.zepto.netTotal;
    const instamartTotal = singleStoresMap.instamart.netTotal;

    const savingsVsCheapestSingle = cheapestSingle.netTotal - splitNetTotal;
    const savingsVsBlinkit = blinkitTotal - splitNetTotal;
    const savingsVsZepto = zeptoTotal - splitNetTotal;
    const savingsVsInstamart = instamartTotal - splitNetTotal;

    // A split is genuinely recommended if it saves money AND spans 2+ stores
    const isSplitCheaper = savingsVsCheapestSingle > 0 && splitGroups.length > 1;

    let badgeText = '';
    let explanation = '';

    if (isSplitCheaper) {
      const comparisonParts = [];
      if (savingsVsZepto > 0) comparisonParts.push(`₹${savingsVsZepto} vs Zepto`);
      if (savingsVsBlinkit > 0) comparisonParts.push(`₹${savingsVsBlinkit} vs Blinkit`);
      if (savingsVsInstamart > 0) comparisonParts.push(`₹${savingsVsInstamart} vs Instamart`);

      badgeText = `Save ${comparisonParts.slice(0, 2).join(' & ')}!`;
      explanation = `Splitting your cart saves ₹${savingsVsCheapestSingle} compared to the cheapest single app (${cheapestSingle.platform}) by getting each item from the store running the lowest price promo.`;
    } else if (splitGroups.length > 1) {
      badgeText = `Single App is Cheaper on this Cart`;
      explanation = `Ordering everything from ${cheapestSingle.platform} (₹${cheapestSingle.netTotal}) is actually ₹${Math.abs(
        savingsVsCheapestSingle
      )} cheaper. Splitting into multiple orders triggers duplicate delivery/handling fees (₹${splitTotalDelivery + splitTotalHandling}) that wipe out item discounts.`;
    } else {
      badgeText = `${cheapestSingle.platform} has the Lowest Prices`;
      explanation = `All items in your cart are already cheapest on ${cheapestSingle.platform}. No split required.`;
    }

    // Sort by ETA for fastest
    const fastestStore = [...singleStoresList].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];

    res.json({
      success: true,
      cartCount: cartItems.length,
      // Option 1: The Smart Split Plan
      smartSplitOption: {
        isRecommended: isSplitCheaper,
        totalCost: splitNetTotal,
        itemsSubtotal: splitItemsSubtotal,
        deliveryFees: splitTotalDelivery,
        handlingFees: splitTotalHandling,
        storesCount: splitGroups.length,
        groups: splitGroups,
        savingsVsCheapestSingle: Math.max(0, savingsVsCheapestSingle),
        savingsVsBlinkit,
        savingsVsZepto,
        savingsVsInstamart,
        badgeText,
        explanation,
      },
      // Options 2, 3, 4: Individual Store Checkouts
      singleStores: {
        blinkit: singleStoresMap.blinkit,
        zepto: singleStoresMap.zepto,
        instamart: singleStoresMap.instamart,
      },
      cheapestSingleStore: {
        platform: cheapestSingle.platform,
        netTotal: cheapestSingle.netTotal,
      },
      fastestStore: {
        platform: fastestStore.platform,
        eta: fastestStore.eta,
        netTotal: fastestStore.netTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  optimizeCart,
};
