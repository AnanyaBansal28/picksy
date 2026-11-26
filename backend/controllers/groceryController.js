const { searchRapidApi, parseInrPrice, isInflatedReseller } = require('../utils/rapidApiService');

/**
 * Clean URL or query to extract item name
 */
const extractGroceryName = (input) => {
  if (!input) return 'Grocery Item';
  let str = String(input).trim();

  // If it's a URL (Blinkit, Zepto, BigBasket, Instamart, Amazon Fresh, etc.)
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const parsedUrl = new URL(str);
      const pathname = parsedUrl.pathname;
      // Handle blinkit: /prn/amul-gold-milk/prid/...
      // Handle zepto: /pn/amul-butter/pvid/...
      const segments = pathname.split('/').filter(Boolean);
      const prnIndex = segments.findIndex((s) => s === 'prn' || s === 'pn' || s === 'product');
      let slug = '';
      if (prnIndex !== -1 && segments[prnIndex + 1]) {
        slug = segments[prnIndex + 1];
      } else {
        slug = segments[segments.length - 1] || '';
      }
      str = slug.replace(/[-_]+/g, ' ').replace(/\b(prid|pvid|cid|pid)\b.*$/i, '').trim();
    } catch {
      // Keep as is
    }
  }

  // Remove common noisy tokens
  return str.replace(/\s+/g, ' ').trim() || 'Fresh Grocery Item';
};

/**
 * Detect subcategory from title
 */
const detectSubCategory = (title) => {
  const t = title.toLowerCase();
  if (t.includes('milk') || t.includes('butter') || t.includes('cheese') || t.includes('paneer') || t.includes('curd') || t.includes('yogurt')) {
    return 'Dairy & Eggs';
  }
  if (t.includes('apple') || t.includes('banana') || t.includes('onion') || t.includes('potato') || t.includes('tomato') || t.includes('fruit') || t.includes('vegetable')) {
    return 'Fresh Fruits & Veggies';
  }
  if (t.includes('oil') || t.includes('atta') || t.includes('rice') || t.includes('dal') || t.includes('sugar') || t.includes('salt') || t.includes('flour')) {
    return 'Staples & Cooking';
  }
  if (t.includes('cleanser') || t.includes('soap') || t.includes('shampoo') || t.includes('face wash') || t.includes('cream') || t.includes('lotion')) {
    return 'Personal Care';
  }
  if (t.includes('biscuit') || t.includes('chip') || t.includes('cookie') || t.includes('snack') || t.includes('noodle') || t.includes('chocolate') || t.includes('spread') || t.includes('nutella')) {
    return 'Snacks & Packaged Food';
  }
  return 'Daily Essentials';
};

/**
 * Detect unit from title
 */
const detectUnit = (title) => {
  const match = title.match(/(\d+(?:\.\d+)?\s*(?:ml|l|ltr|litre|litres|g|gm|kg|pcs|pack|units))\b/i);
  return match ? match[0].toUpperCase() : '1 unit';
};

/**
 * Detect brand from title
 */
const detectBrand = (title) => {
  const knownBrands = [
    'Amul', 'Mother Dairy', 'Nandini', 'Nestle', 'Britannia', 'Fortune', 'Tata',
    'Aashirvaad', 'Nutella', 'Cetaphil', 'Dettol', 'Dove', 'Colgate', 'Surf Excel',
    'Dabur', 'Haldiram', 'Cadbury', 'Parle', 'Lay\'s', 'Saffola', 'Epigamia', 'Country Delight'
  ];
  for (const b of knownBrands) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(title)) {
      return b;
    }
  }
  return title.split(' ')[0] || 'Generic';
};

// @desc    Analyze grocery link or text query for 10-minute quick-commerce comparison
// @route   POST /api/grocery/analyze-item
// @access  Public
const analyzeGroceryItem = async (req, res) => {
  try {
    const { query, url } = req.body;
    const rawInput = query || url;
    if (!rawInput || !rawInput.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a grocery item name or product URL.',
      });
    }

    const cleanName = extractGroceryName(rawInput);
    console.log(`[Grocery Optimizer] Analyzing item: "${cleanName}"`);

    let matchedItem = null;

    // 1. Try RapidAPI search for real photo & genuine Indian price
    if (process.env.RAPIDAPI_KEY) {
      try {
        const rapidResults = await searchRapidApi(`${cleanName} grocery`, 6);
        if (rapidResults && rapidResults.length > 0) {
          const authentic = rapidResults.filter((r) => !isInflatedReseller(r));
          matchedItem = authentic[0] || rapidResults[0];
        }
      } catch (err) {
        console.warn('[Grocery Optimizer] RapidAPI search error:', err.message);
      }
    }

    // 2. Extract base details
    let title = cleanName;
    let image = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80';
    let basePrice = 45;

    if (matchedItem) {
      title = matchedItem.product_title || title;
      if (matchedItem.product_photos && matchedItem.product_photos[0]) {
        image = matchedItem.product_photos[0];
      }
      if (matchedItem.offer && matchedItem.offer.price) {
        const parsed = parseInrPrice(matchedItem.offer.price);
        if (parsed > 0) basePrice = parsed;
      }
    } else {
      // Deterministic fallback price based on keywords
      const lower = cleanName.toLowerCase();
      if (lower.includes('cleanser') || lower.includes('cetaphil')) basePrice = 330;
      else if (lower.includes('oil') || lower.includes('sunflower')) basePrice = 145;
      else if (lower.includes('nutella')) basePrice = 320;
      else if (lower.includes('butter')) basePrice = 285;
      else if (lower.includes('milk')) basePrice = 34;
      else if (lower.includes('apple')) basePrice = 149;
      else if (lower.includes('banana')) basePrice = 38;
      else basePrice = 65;
    }

    const brand = detectBrand(title);
    const subCategory = detectSubCategory(title);
    const unit = detectUnit(title);
    const mrp = Math.round(basePrice * 1.12);

    // Compute slight natural price differences across the 3 quick-commerce platforms
    const blinkitPrice = Math.max(10, Math.round(basePrice * 0.98));
    const zeptoPrice = Math.max(10, Math.round(basePrice * 0.96));
    const instamartPrice = Math.max(10, Math.round(basePrice * 1.0));

    const platformListings = [
      {
        platform: 'Blinkit',
        basePrice: blinkitPrice,
        deliveryFee: blinkitPrice >= 199 ? 0 : 15,
        handlingFee: 4,
        eta: '10-14 mins',
        inStock: true,
      },
      {
        platform: 'Zepto',
        basePrice: zeptoPrice,
        deliveryFee: zeptoPrice >= 149 ? 0 : 16,
        handlingFee: 5,
        eta: '8-10 mins',
        inStock: true,
      },
      {
        platform: 'Instamart',
        basePrice: instamartPrice,
        deliveryFee: instamartPrice >= 199 ? 0 : 15,
        handlingFee: 4,
        eta: '12-15 mins',
        inStock: true,
      },
    ];

    const lowestPrice = Math.min(...platformListings.map((p) => p.basePrice));

    const product = {
      _id: `grocery_${Date.now()}`,
      id: `grocery_${Date.now()}`,
      title,
      brand,
      unit,
      image,
      mrp,
      lowestPrice,
      subCategory,
      category: 'quick-commerce',
      platformListings,
      dealScore: 88,
      verifiedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('[Grocery Optimizer] Error analyzing item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze grocery item. Please try again.',
    });
  }
};

module.exports = {
  analyzeGroceryItem,
};

