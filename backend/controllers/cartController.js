const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const inMemoryStore = require('../config/inMemoryStore');

// Platform delivery fee configurations
const PLATFORM_CONFIG = {
  Blinkit: { defaultDelivery: 15, freeThreshold: 249, handling: 4, etaMins: 10 },
  Zepto: { defaultDelivery: 16, freeThreshold: 199, handling: 5, etaMins: 9 },
  Instamart: { defaultDelivery: 20, freeThreshold: 299, handling: 3, etaMins: 14 },
};

// @desc    Optimize Quick-Commerce cart with platform-specific custom selection & comparisons
// @route   POST /api/cart/optimize
// @access  Public
const optimizeCart = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { productId, platform?, quantity }

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

    const cartEntries = items
      .map((cartItem) => {
        const product = products.find(
          (p) => (p._id || p.id).toString() === cartItem.productId.toString()
        );
        return {
          product,
          productId: cartItem.productId,
          chosenPlatform: cartItem.platform || null,
          quantity: Math.max(1, parseInt(cartItem.quantity, 10) || 1),
        };
      })
      .filter((ci) => ci.product !== undefined);

    if (cartEntries.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products found in cart.' });
    }

    const platforms = ['Blinkit', 'Zepto', 'Instamart'];

    // 1. Calculate Consolidated Unique Products Needed (for Single-Store and Optimal Split)
    const productQtyMap = {};
    for (const entry of cartEntries) {
      const pId = (entry.product._id || entry.product.id).toString();
      productQtyMap[pId] = (productQtyMap[pId] || 0) + entry.quantity;
    }

    const uniqueProductItems = Object.keys(productQtyMap).map((pId) => {
      const product = products.find((p) => (p._id || p.id).toString() === pId);
      return { product, quantity: productQtyMap[pId] };
    });

    // 2. Calculate Single-Store Checkouts (All from Blinkit, All from Zepto, All from Instamart)
    const singleStoresMap = {};
    const singleStoresList = [];

    for (const platformName of platforms) {
      const config = PLATFORM_CONFIG[platformName];
      let itemSubtotal = 0;
      let missingItems = 0;
      const itemBreakdown = [];

      for (const item of uniqueProductItems) {
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

    // 3. Compute User's Custom Cart Breakdown (if platforms were selected by user)
    const customStoreBuckets = { Blinkit: [], Zepto: [], Instamart: [] };
    const switchSuggestions = [];

    for (const entry of cartEntries) {
      // Find listing for the chosen platform, or fallback to cheapest in-stock
      let chosenPlatform = entry.chosenPlatform;

      // Find absolute cheapest platform for comparison / suggestion
      let absoluteCheapestListing = null;
      let minBasePrice = Infinity;
      for (const l of entry.product.platformListings || []) {
        if (platforms.includes(l.platform) && l.inStock) {
          if (l.basePrice < minBasePrice) {
            minBasePrice = l.basePrice;
            absoluteCheapestListing = l;
          }
        }
      }

      if (!chosenPlatform && absoluteCheapestListing) {
        chosenPlatform = absoluteCheapestListing.platform;
      }

      const chosenListing = entry.product.platformListings?.find((l) => l.platform === chosenPlatform) || absoluteCheapestListing;
      const price = chosenListing?.basePrice || minBasePrice;
      const lineTotal = price * entry.quantity;

      customStoreBuckets[chosenPlatform].push({
        productId: entry.product._id || entry.product.id,
        title: entry.product.title,
        brand: entry.product.brand,
        unit: entry.product.unit,
        image: entry.product.image,
        chosenPlatform,
        unitPrice: price,
        quantity: entry.quantity,
        lineTotal,
      });

      // If user selected a platform that costs more than the cheapest available platform
      if (absoluteCheapestListing && absoluteCheapestListing.platform !== chosenPlatform) {
        const potentialSavePerUnit = price - absoluteCheapestListing.basePrice;
        if (potentialSavePerUnit > 0) {
          switchSuggestions.push({
            productId: entry.product._id || entry.product.id,
            productTitle: entry.product.title,
            currentPlatform: chosenPlatform,
            currentUnitPrice: price,
            betterPlatform: absoluteCheapestListing.platform,
            betterUnitPrice: absoluteCheapestListing.basePrice,
            quantity: entry.quantity,
            totalSavings: potentialSavePerUnit * entry.quantity,
          });
        }
      }
    }

    // Tally Custom Cart by platform
    let customItemsSubtotal = 0;
    let customTotalDelivery = 0;
    let customTotalHandling = 0;
    const customStoreGroups = [];

    for (const platformName of platforms) {
      const itemsInStore = customStoreBuckets[platformName];
      if (itemsInStore && itemsInStore.length > 0) {
        const groupSubtotal = itemsInStore.reduce((sum, i) => sum + i.lineTotal, 0);
        const config = PLATFORM_CONFIG[platformName];
        const unlockedFree = groupSubtotal >= config.freeThreshold;
        const delivery = unlockedFree ? 0 : config.defaultDelivery;
        const handling = config.handling;

        customItemsSubtotal += groupSubtotal;
        customTotalDelivery += delivery;
        customTotalHandling += handling;

        customStoreGroups.push({
          platform: platformName,
          items: itemsInStore,
          itemsCount: itemsInStore.length,
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

    const customCartTotal = customItemsSubtotal + customTotalDelivery + customTotalHandling;

    // 4. Compute Picksy Optimal Split (Cheapest theoretical item-by-item assignment)
    const optimalBuckets = { Blinkit: [], Zepto: [], Instamart: [] };
    for (const item of uniqueProductItems) {
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
        optimalBuckets[platform].push({
          productId: item.product._id || item.product.id,
          title: item.product.title,
          brand: item.product.brand,
          unitPrice: cheapestListing.basePrice,
          quantity: item.quantity,
          lineTotal: cheapestListing.basePrice * item.quantity,
        });
      }
    }

    let optimalItemsSubtotal = 0;
    let optimalTotalDelivery = 0;
    let optimalTotalHandling = 0;
    const optimalGroups = [];

    for (const platformName of platforms) {
      const groupItems = optimalBuckets[platformName];
      if (groupItems && groupItems.length > 0) {
        const groupSubtotal = groupItems.reduce((sum, i) => sum + i.lineTotal, 0);
        const config = PLATFORM_CONFIG[platformName];
        const unlockedFree = groupSubtotal >= config.freeThreshold;
        const delivery = unlockedFree ? 0 : config.defaultDelivery;
        const handling = config.handling;

        optimalItemsSubtotal += groupSubtotal;
        optimalTotalDelivery += delivery;
        optimalTotalHandling += handling;

        optimalGroups.push({
          platform: platformName,
          items: groupItems,
          itemsCount: groupItems.length,
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

    const optimalNetTotal = optimalItemsSubtotal + optimalTotalDelivery + optimalTotalHandling;

    // 5. Comparison Metrics: Custom Cart vs Single Stores & Optimal Split
    const sortedSingleStores = [...singleStoresList].sort((a, b) => a.netTotal - b.netTotal);
    const cheapestSingle = sortedSingleStores[0];

    const blinkitTotal = singleStoresMap.blinkit.netTotal;
    const zeptoTotal = singleStoresMap.zepto.netTotal;
    const instamartTotal = singleStoresMap.instamart.netTotal;

    const savingsVsBlinkit = blinkitTotal - customCartTotal;
    const savingsVsZepto = zeptoTotal - customCartTotal;
    const savingsVsInstamart = instamartTotal - customCartTotal;
    const savingsVsCheapestSingle = cheapestSingle.netTotal - customCartTotal;

    let customCartSummaryBadge = '';
    let customCartExplanation = '';

    if (savingsVsCheapestSingle > 0 && customStoreGroups.length > 1) {
      const comparisonStrings = [];
      if (savingsVsZepto > 0) comparisonStrings.push(`₹${savingsVsZepto} vs Zepto`);
      if (savingsVsBlinkit > 0) comparisonStrings.push(`₹${savingsVsBlinkit} vs Blinkit`);
      if (savingsVsInstamart > 0) comparisonStrings.push(`₹${savingsVsInstamart} vs Instamart`);

      customCartSummaryBadge = `Saves ${comparisonStrings.slice(0, 2).join(' & ')}!`;
      customCartExplanation = `Your custom split cart saves ₹${savingsVsCheapestSingle} compared to ordering everything from the cheapest single app (${cheapestSingle.platform}).`;
    } else if (customStoreGroups.length > 1 && savingsVsCheapestSingle < 0) {
      customCartSummaryBadge = `Single Store May Be Cheaper`;
      customCartExplanation = `Ordering everything from ${cheapestSingle.platform} (₹${cheapestSingle.netTotal}) would save ₹${Math.abs(savingsVsCheapestSingle)} because splitting incurs duplicate delivery/handling fees (₹${customTotalDelivery + customTotalHandling}).`;
    } else {
      customCartSummaryBadge = `Optimized Selection`;
      customCartExplanation = `Your selection is priced at ₹${customCartTotal}. Compare with other options below.`;
    }

    res.json({
      success: true,
      cartCount: cartEntries.reduce((sum, e) => sum + e.quantity, 0),
      // 1. User's Exact Custom Cart
      customCart: {
        totalCost: customCartTotal,
        itemsSubtotal: customItemsSubtotal,
        deliveryFees: customTotalDelivery,
        handlingFees: customTotalHandling,
        storesCount: customStoreGroups.length,
        storeGroups: customStoreGroups,
        savingsVsBlinkit,
        savingsVsZepto,
        savingsVsInstamart,
        savingsVsCheapestSingle,
        summaryBadge: customCartSummaryBadge,
        explanation: customCartExplanation,
        switchSuggestions,
      },
      // 2. Picksy Theoretical Optimal Split
      smartSplitOption: {
        isRecommended: optimalNetTotal < cheapestSingle.netTotal && optimalGroups.length > 1,
        totalCost: optimalNetTotal,
        itemsSubtotal: optimalItemsSubtotal,
        deliveryFees: optimalTotalDelivery,
        handlingFees: optimalTotalHandling,
        storesCount: optimalGroups.length,
        groups: optimalGroups,
        savingsVsCheapestSingle: Math.max(0, cheapestSingle.netTotal - optimalNetTotal),
        savingsVsBlinkit: blinkitTotal - optimalNetTotal,
        savingsVsZepto: zeptoTotal - optimalNetTotal,
        savingsVsInstamart: instamartTotal - optimalNetTotal,
        badgeText:
          optimalNetTotal < cheapestSingle.netTotal && optimalGroups.length > 1
            ? `Save ₹${cheapestSingle.netTotal - optimalNetTotal} vs ${cheapestSingle.platform}!`
            : 'Single Store Optimal',
      },
      // 3. Single-Store Direct Options (All Blinkit, All Zepto, All Instamart)
      singleStores: {
        blinkit: singleStoresMap.blinkit,
        zepto: singleStoresMap.zepto,
        instamart: singleStoresMap.instamart,
      },
      cheapestSingleStore: {
        platform: cheapestSingle.platform,
        netTotal: cheapestSingle.netTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  optimizeCart,
};
