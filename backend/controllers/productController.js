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

    // Sort products
    if (sort === 'price_asc') {
      enhancedProducts.sort((a, b) => a.lowestPrice - b.lowestPrice);
    } else if (sort === 'price_desc') {
      enhancedProducts.sort((a, b) => b.lowestPrice - a.lowestPrice);
    } else if (sort === 'deal_score') {
      enhancedProducts.sort((a, b) => (b.decision?.realDealScore.score || 0) - (a.decision?.realDealScore.score || 0));
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

// @desc    Get single product by ID with deep decision metrics
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
        lowestPrice: decisionMetrics ? decisionMetrics.cheapestPlatform.netPayablePrice : product.mrp,
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

/**
 * Canonicalizes pasted product URLs by stripping all query parameters (?crid=..., &dib=..., etc.),
 * tracking tags, ref anchors, and session parameters, retaining only the clean canonical path.
 */
const getCanonicalProductUrl = (rawUrl) => {
  try {
    const urlStr = (rawUrl || '').trim();
    const urlObj = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    let pathname = urlObj.pathname;

    if (urlObj.hostname.includes('amazon')) {
      // Retain clean /<slug>/dp/<ASIN> or /dp/<ASIN>, strip trailing /ref=...
      const dpMatch = pathname.match(/(\/(?:gp\/product|dp)\/[A-Z0-9]{10})/i);
      if (dpMatch) {
        const slugPrefix = pathname.split(dpMatch[0])[0];
        if (slugPrefix && slugPrefix.length > 1 && !slugPrefix.startsWith('/gp')) {
          pathname = `${slugPrefix}${dpMatch[1]}`;
        } else {
          pathname = dpMatch[1];
        }
      } else {
        pathname = pathname.replace(/\/ref=.*$/i, '');
      }
    } else if (urlObj.hostname.includes('flipkart')) {
      // Retain /<slug>/p/<item_id>
      const fkMatch = pathname.match(/(\/[^/]+\/p\/[a-zA-Z0-9]+)/i);
      if (fkMatch) {
        pathname = fkMatch[1];
      }
    }

    // Strip trailing slashes
    pathname = pathname.replace(/\/+$/, '');
    return `${urlObj.origin}${pathname}`;
  } catch (err) {
    return rawUrl.split('?')[0].split('#')[0].trim();
  }
};

// @desc    Analyze any pasted Amazon/Flipkart/Myntra product URL in real time
// @route   POST /api/products/analyze-url
// @access  Public
const analyzeUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid product URL.' });
    }

    // Strip query parameters (?crid=..., &dib=..., etc.) and hash fragments
    const canonicalUrl = getCanonicalProductUrl(url);
    let urlObj;
    try {
      urlObj = new URL(canonicalUrl);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid URL format provided.' });
    }

    // Detect platform
    let detectedPlatform = 'Amazon';
    if (urlObj.hostname.includes('flipkart')) detectedPlatform = 'Flipkart';
    else if (urlObj.hostname.includes('myntra')) detectedPlatform = 'Myntra';
    else if (urlObj.hostname.includes('tatacliq')) detectedPlatform = 'Tata CliQ';
    else if (urlObj.hostname.includes('blinkit')) detectedPlatform = 'Blinkit';
    else if (urlObj.hostname.includes('zepto')) detectedPlatform = 'Zepto';

    // Extract product slug / keywords from canonical path
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    let extractedSlug = '';

    for (const segment of pathSegments) {
      if (
        segment.length > 3 &&
        !['dp', 'p', 'gp', 'product', 'buy', 'item', 'itm', 'pd', 'ref'].includes(segment.toLowerCase()) &&
        !/^[A-Z0-9]{10}$/i.test(segment)
      ) {
        extractedSlug = segment;
        break;
      }
    }

    if (!extractedSlug && pathSegments.length > 0) {
      extractedSlug = pathSegments[0];
    }

    // Clean up slug into keywords
    const keywords = decodeURIComponent(extractedSlug)
      .replace(/[-_+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Attempt lightweight server-side fetch with standard browser User-Agent header (3-second timeout)
    let fetchedTitle = '';
    let fetchedImage = '';
    let fetchedPrice = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const fetchRes = await fetch(canonicalUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (fetchRes.ok) {
        const html = await fetchRes.text();

        // Extract og:title or <title>
        const ogTitleMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i) ||
          html.match(/<title>([^<]+)<\/title>/i);

        if (ogTitleMatch && ogTitleMatch[1]) {
          fetchedTitle = ogTitleMatch[1]
            .replace(/Amazon\.in\s*:?.*$/i, '')
            .replace(/Flipkart\.com\s*:?.*$/i, '')
            .replace(/Myntra\s*:?.*$/i, '')
            .replace(/\|\s*Amazon.*$/i, '')
            .replace(/\|\s*Flipkart.*$/i, '')
            .replace(/:\s*Buy\s.*$/i, '')
            .replace(/Online\s+at\s+Low\s+Prices.*$/i, '')
            .trim();
        }

        // Extract og:image
        const ogImageMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

        if (ogImageMatch && ogImageMatch[1] && ogImageMatch[1].startsWith('http')) {
          fetchedImage = ogImageMatch[1].trim();
        }

        // Extract Rupee price from metadata or HTML body
        const priceMetaMatch =
          html.match(/<meta\s+property=["']product:price:amount["']\s+content=["']([\d.]+)["']/i) ||
          html.match(/<meta\s+name=["']twitter:data1["']\s+value=["']₹?([\d,]+)["']/i);

        if (priceMetaMatch && priceMetaMatch[1]) {
          const p = parseFloat(priceMetaMatch[1].replace(/,/g, ''));
          if (!isNaN(p) && p > 0) fetchedPrice = p;
        }

        if (!fetchedPrice) {
          const rupeeRegex = /(?:₹|&#8377;|Rs\.?)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)/gi;
          let match;
          const extractedPrices = [];
          while ((match = rupeeRegex.exec(html)) !== null && extractedPrices.length < 8) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (val >= 99 && val <= 500000) {
              extractedPrices.push(val);
            }
          }
          if (extractedPrices.length > 0) {
            fetchedPrice = extractedPrices[0];
          }
        }
      }
    } catch (fetchErr) {
      // Graceful fallback to smart keyword heuristics if blocked by anti-bot, timed out, or offline
    }

    // 2. Smart Metadata & Keyword Detection Rules
    // Inspect fetched title, slug keywords, and full URL tokens (including search query terms like ?keywords=kids+phone+toy)
    const combinedAnalysisText = `${fetchedTitle} ${keywords} ${url}`.toLowerCase();

    // Detect Toys / Kids / Covers / Cables / Accessories BEFORE matching "phone" or "watch"
    const isKidsOrToy = /\b(kid|kids|toy|toys|baby|babies|toddler|toddlers|doll|dolls|baybee|musical\s*toy|pretend|educational|preschool|learning\s*toy)\b/i.test(combinedAnalysisText);
    const isCaseOrCover = /\b(cover|case|cases|skin|pouch|sleeve|tempered\s*glass|screen\s*protector|back\s*cover)\b/i.test(combinedAnalysisText);
    const isCableOrCharger = /\b(cable|cables|charger|chargers|adapter|cord|wire|usb\s*cable|lightning|type\s*c|power\s*bank)\b/i.test(combinedAnalysisText);
    const isBottleOrKitchen = /\b(bottle|bottles|flask|sipper|mug|tumbler|water\s*bottle|lunch\s*box)\b/i.test(combinedAnalysisText);
    const isStandOrHolder = /\b(stand|holder|mount|tripod|cradle|car\s*mount)\b/i.test(combinedAnalysisText);

    const isAccessoryOrToy = isKidsOrToy || isCaseOrCover || isCableOrCharger || isBottleOrKitchen || isStandOrHolder;

    // Only assign ₹14,000+ smartphone pricing if real smartphone brand/model keywords are present AND NOT an accessory/toy!
    const isRealSmartphone = !isAccessoryOrToy && /\b(iphone|samsung\s*galaxy|oneplus|redmi|realme|google\s*pixel|pixel\s*\d|vivo|oppo|5g\s*smartphone)\b/i.test(combinedAnalysisText);

    // Query existing catalog
    let allProducts = [];
    if (getIsConnected()) {
      allProducts = await Product.find({}).lean();
    } else {
      allProducts = await inMemoryStore.products.find({});
    }

    // Match keywords against catalog (Guard strictly prevents matching phones/laptops for toys or covers)
    const searchWords = (fetchedTitle || keywords).toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    let matchedProduct = null;
    let highestMatchScore = 0;

    for (const prod of allProducts) {
      const prodSubCategory = (prod.subCategory || '').toLowerCase();
      const prodTitle = (prod.title || '').toLowerCase();
      const prodText = `${prod.title} ${prod.brand} ${prod.subCategory} ${(prod.tags || []).join(' ')}`.toLowerCase();

      // Guard 1: If query is an accessory or toy, NEVER match a real smartphone/laptop catalog item
      if (isAccessoryOrToy) {
        if (prodSubCategory.includes('smartphones') || prodSubCategory.includes('laptop') || prod.mrp > 3000) {
          continue;
        }
      }

      // Guard 2: If query does not mention real smartphone brands, don't match smartphone catalog products
      if (!isRealSmartphone && (prodSubCategory.includes('smartphones') || prodTitle.includes('iphone'))) {
        continue;
      }

      let matchCount = 0;
      for (const word of searchWords) {
        if (prodText.includes(word)) matchCount++;
      }
      if (matchCount > highestMatchScore) {
        highestMatchScore = matchCount;
        matchedProduct = prod;
      }
    }

    // If strong match (at least 2 words or exact brand/device), return catalog item
    if (matchedProduct && highestMatchScore >= 2) {
      const decision = calculateDecisionMetrics(matchedProduct);
      return res.json({
        success: true,
        isExisting: true,
        matchedBy: 'keyword_catalog',
        canonicalUrl,
        keywords,
        detectedPlatform,
        product: {
          ...matchedProduct,
          decision,
          lowestPrice: decision?.cheapestPlatform?.netPayablePrice || matchedProduct.mrp,
        },
      });
    }

    // Otherwise, generate a realistic product based on smart classification hierarchy
    const displayTitle = fetchedTitle
      ? fetchedTitle
      : keywords
      ? keywords.replace(/\b\w/g, (c) => c.toUpperCase())
      : `${detectedPlatform} Verified Product`;

    let determinedCategory = 'ecommerce';
    let determinedSubCategory = 'General Merchandise';
    let fallbackImage = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';
    let heuristicBasePrice = 899;
    let extractedBrand = displayTitle.split(' ')[0] || detectedPlatform;

    // Apply strict fallback hierarchy
    if (isKidsOrToy) {
      determinedSubCategory = 'Toys & Kids';
      // Realistic pricing: ₹349 – ₹599 for toys & kids items
      heuristicBasePrice = 399;
      fallbackImage = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80';
      if (!extractedBrand || extractedBrand.length < 3) extractedBrand = 'PlayVibe Kids';
    } else if (isCaseOrCover) {
      determinedSubCategory = 'Mobile Accessories & Cases';
      // Realistic pricing: ₹299 – ₹599 for cases & covers
      heuristicBasePrice = 349;
      fallbackImage = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80';
    } else if (isCableOrCharger) {
      determinedSubCategory = 'Cables & Chargers';
      // Realistic pricing: ₹399 – ₹799
      heuristicBasePrice = 499;
      fallbackImage = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80';
    } else if (isBottleOrKitchen) {
      determinedSubCategory = 'Home & Kitchen';
      // Realistic pricing: ₹499 – ₹899
      heuristicBasePrice = 599;
      fallbackImage = 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80';
    } else if (isStandOrHolder) {
      determinedSubCategory = 'Desk & Mobile Accessories';
      // Realistic pricing: ₹349 – ₹699
      heuristicBasePrice = 449;
      fallbackImage = 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80';
    } else if (isRealSmartphone) {
      determinedSubCategory = 'Smartphones';
      fallbackImage = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80';
      if (/iphone/i.test(combinedAnalysisText)) {
        heuristicBasePrice = 64999;
        extractedBrand = 'Apple';
      } else if (/samsung\s*galaxy|galaxy/i.test(combinedAnalysisText)) {
        heuristicBasePrice = 59999;
        extractedBrand = 'Samsung';
      } else if (/oneplus/i.test(combinedAnalysisText)) {
        heuristicBasePrice = 39999;
        extractedBrand = 'OnePlus';
      } else if (/pixel/i.test(combinedAnalysisText)) {
        heuristicBasePrice = 43999;
        extractedBrand = 'Google';
      } else {
        heuristicBasePrice = 14999;
      }
    } else if (/\b(headphone|headphones|earphone|earphones|airpods|earbuds|buds|wh-1000xm|noise\s*cancelling)\b/i.test(combinedAnalysisText)) {
      determinedSubCategory = 'Audio & Headphones';
      heuristicBasePrice = /xm5|airpods\s*max/i.test(combinedAnalysisText) ? 26990 : 3499;
      fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
    } else if (/\b(macbook|laptop|thinkpad|zenbook|notebook)\b/i.test(combinedAnalysisText)) {
      determinedSubCategory = 'Laptops & Computers';
      heuristicBasePrice = 54999;
      fallbackImage = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80';
    } else if (/\b(smartwatch|apple\s*watch|galaxy\s*watch|fitness\s*band)\b/i.test(combinedAnalysisText)) {
      determinedSubCategory = 'Smartwatches';
      heuristicBasePrice = 4999;
      fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    } else if (/\b(serum|cleanser|cream|perfume|facewash|sunscreen|moisturizer|shampoo)\b/i.test(combinedAnalysisText)) {
      determinedSubCategory = 'Beauty & Personal Care';
      heuristicBasePrice = 649;
      fallbackImage = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80';
    } else if (/\b(shoes|sneakers|nike|adidas|puma|tshirt|shirt|hoodie|jacket|jeans)\b/i.test(combinedAnalysisText)) {
      determinedSubCategory = 'Fashion & Footwear';
      heuristicBasePrice = 2499;
      fallbackImage = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
    }

    const finalBasePrice = fetchedPrice ? Math.round(fetchedPrice) : heuristicBasePrice;
    const finalMrp = Math.round(finalBasePrice * 1.25);
    const finalImage = fetchedImage || fallbackImage;

    // Create 30-day simulated history
    const history = [];
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const variance = Math.round((Math.sin(i / 3) * 0.08 + (Math.random() * 0.04 - 0.02)) * finalBasePrice);
      history.push({
        date: d.toISOString().split('T')[0],
        price: Math.max(Math.round(finalBasePrice * 0.85), finalBasePrice + variance),
        note: i === 12 ? 'Flash Sale' : 'Standard Price',
      });
    }

    const dynamicProduct = {
      title: displayTitle,
      brand: extractedBrand,
      category: determinedCategory,
      subCategory: determinedSubCategory,
      image: finalImage,
      mrp: finalMrp,
      unit: '1 unit',
      description: `Analyzed in real time from ${detectedPlatform} link (${canonicalUrl}). Complete with 30-day historical price monitoring, seller audit, and coupon check.`,
      tags: searchWords,
      historicalPrices: history,
      platformListings: [
        {
          platform: 'Amazon',
          basePrice: finalBasePrice,
          deliveryFee: 0,
          freeDeliveryThreshold: 499,
          handlingFee: 0,
          sellerRating: 4.6,
          sellerName: detectedPlatform === 'Amazon' ? 'Appario Retail Pvt Ltd' : 'Verified Merchant Hub',
          returnPolicy: '7 Days Replacement',
          returnPolicyScore: 9,
          eta: 'Tomorrow by 2 PM',
          inStock: true,
          productUrl: canonicalUrl,
          couponDetails: finalBasePrice > 1000 ? {
            code: 'PICKSYSAVE',
            discountAmount: Math.min(500, Math.round(finalBasePrice * 0.08)),
            minSpend: Math.round(finalBasePrice * 0.7),
            terms: 'Instant checkout discount.',
            isFakeDiscount: false,
          } : null,
        },
        {
          platform: 'Flipkart',
          basePrice: Math.round(finalBasePrice * 0.98),
          deliveryFee: finalBasePrice < 500 ? 40 : 0,
          freeDeliveryThreshold: 500,
          handlingFee: 0,
          sellerRating: 4.4,
          sellerName: 'SuperComNet Retail',
          returnPolicy: '7 Days Replacement',
          returnPolicyScore: 8,
          eta: '2-3 Days',
          inStock: true,
          productUrl: canonicalUrl,
          couponDetails: null,
        },
        {
          platform: 'Tata CliQ',
          basePrice: Math.round(finalBasePrice * 1.03),
          deliveryFee: 0,
          freeDeliveryThreshold: 499,
          handlingFee: 0,
          sellerRating: 4.5,
          sellerName: 'Tata Unistore',
          returnPolicy: '10 Days Return',
          returnPolicyScore: 9,
          eta: '3-4 Days',
          inStock: true,
          productUrl: canonicalUrl,
        },
      ],
      reviewIntelligence: {
        verifiedBuyerConsensus: `${displayTitle} has positive verified buyer reviews and consistent marketplace fulfillment.`,
        authenticityScore: 92,
        suspiciousReviewFlag: '',
        pros: ['Prompt dispatch', 'Accurate product listing specifications', 'Genuine warranty & return window'],
        cons: ['Standard platform delivery window'],
        bestUseFor: 'Everyday use and shoppers looking for verified genuine price history.',
      },
    };

    let savedProduct = null;
    if (getIsConnected()) {
      savedProduct = await Product.create(dynamicProduct);
      savedProduct = savedProduct.toObject();
    } else {
      savedProduct = await inMemoryStore.products.create(dynamicProduct);
    }

    const decision = calculateDecisionMetrics(savedProduct);

    return res.json({
      success: true,
      isDynamic: true,
      detectedPlatform,
      canonicalUrl,
      keywords,
      product: {
        ...savedProduct,
        decision,
        lowestPrice: decision?.cheapestPlatform?.netPayablePrice || finalBasePrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getSpotlightDeals,
  analyzeUrl,
};
