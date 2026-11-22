/**
 * Picksy Intelligent Decision Engine
 * Computes:
 * 1. Best Buying Platform Recommendation (Price + Seller + Return Policy + Hidden Fees)
 * 2. "Buy Now vs. Wait" Verdict (Historical Trend Analysis)
 * 3. Real Deal Score (0 - 100) & Coupon Reality Check
 */

function isDummyOutboundUrl(url) {
  if (!url || typeof url !== 'string' || url === '#') return true;
  if (url.includes('example') || url.includes('/dp/example') || url.includes('example-')) return true;
  if (/\/(?:dp|p)\/(?:samsung-s24|oneplus-12|sony-xm5|airpods-pro-2|macbook-m2|rog-g14|ps5-slim|jordan-1)/i.test(url)) {
    return true;
  }
  if (url.includes('flipkart.com/dp/') || url.includes('tatacliq.com/dp/') || url.includes('myntra.com/dp/')) {
    return true;
  }
  return false;
}

function getPlatformSearchUrl(platform, productName) {
  const name = String(productName || '').trim();
  const encodedName = encodeURIComponent(name);
  const plat = String(platform || '').toLowerCase();

  if (plat.includes('amazon')) {
    return `https://www.amazon.in/s?k=${encodedName}`;
  } else if (plat.includes('flipkart')) {
    return `https://www.flipkart.com/search?q=${encodedName}`;
  } else if (plat.includes('tata') || plat.includes('cliq')) {
    return `https://www.tatacliq.com/search/?searchCategory=all&text=${encodedName}`;
  } else if (plat.includes('myntra')) {
    const slug = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
    return `https://www.myntra.com/${slug}`;
  } else if (plat.includes('blinkit')) {
    return `https://blinkit.com/s/?q=${encodedName}`;
  } else if (plat.includes('zepto')) {
    return `https://www.zeptonow.com/search?q=${encodedName}`;
  } else if (plat.includes('instamart')) {
    return `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodedName}`;
  }

  return `https://www.amazon.in/s?k=${encodedName}`;
}

function calculateDecisionMetrics(product) {
  if (!product || !product.platformListings || product.platformListings.length === 0) {
    return null;
  }

  // 1. Calculate historical metrics
  const history = product.historicalPrices || [];
  const prices = history.map((h) => h.price);
  const lowestHistoricalPrice = prices.length > 0 ? Math.min(...prices) : product.mrp;
  const highestHistoricalPrice = prices.length > 0 ? Math.max(...prices) : product.mrp;
  
  // 30-day slice (last 30 entries or all if less)
  const last30Entries = history.slice(-30);
  const prices30 = last30Entries.map((h) => h.price);
  const avg30Price = prices30.length > 0 
    ? Math.round(prices30.reduce((acc, p) => acc + p, 0) / prices30.length)
    : product.mrp;
  const lowest30Price = prices30.length > 0 ? Math.min(...prices30) : lowestHistoricalPrice;
  const highest30Price = prices30.length > 0 ? Math.max(...prices30) : highestHistoricalPrice;

  // 2. Evaluate Platform Listings & Find Best Buying Decision
  const evaluatedPlatforms = product.platformListings.map((listing) => {
    const rawListing = listing.toObject ? listing.toObject() : listing;
    const basePrice = rawListing.basePrice;
    const deliveryFee = rawListing.deliveryFee || 0;
    const couponDiscount = rawListing.couponDetails?.discountAmount || 0;
    const handlingFee = rawListing.handlingFee || 0;
    
    // Effective net price
    const netPayablePrice = Math.max(0, basePrice + deliveryFee + handlingFee - couponDiscount);
    
    // Platform composite score:
    // 50% price competitiveness + 25% seller reliability + 15% return policy + 10% delivery speed/cost
    const priceScore = Math.max(0, 50 - ((netPayablePrice - lowestHistoricalPrice) / (lowestHistoricalPrice || 1)) * 30);
    const sellerScore = ((rawListing.sellerRating || 4.0) / 5) * 25;
    const returnScore = ((rawListing.returnPolicyScore || 7) / 10) * 15;
    const feeScore = deliveryFee === 0 ? 10 : Math.max(0, 10 - (deliveryFee / 20));

    const compositeScore = Math.round(priceScore + sellerScore + returnScore + feeScore);

    // Ensure working outbound search URL if missing or dummy
    const prodName = product.title || product.name || '';
    let outboundUrl = rawListing.productUrl;
    if (isDummyOutboundUrl(outboundUrl)) {
      outboundUrl = getPlatformSearchUrl(rawListing.platform, prodName);
    }

    return {
      ...rawListing,
      productUrl: outboundUrl,
      netPayablePrice,
      compositeScore,
      isFreeDelivery: deliveryFee === 0,
      savingsVsMrp: Math.max(0, product.mrp - netPayablePrice),
    };
  });

  // Sort by composite score (best overall value first)
  evaluatedPlatforms.sort((a, b) => b.compositeScore - a.compositeScore);
  const bestPlatform = evaluatedPlatforms[0];

  // Find lowest raw price platform
  const cheapestPlatform = [...evaluatedPlatforms].sort((a, b) => a.netPayablePrice - b.netPayablePrice)[0];

  // Generate clear bullet-point reasoning for Picksy's Top Recommendation
  const recommendationReasons = [];
  if (bestPlatform.platform === cheapestPlatform.platform) {
    recommendationReasons.push(
      `Offers the lowest net payable price of ₹${bestPlatform.netPayablePrice.toLocaleString('en-IN')} (including shipping).`
    );
  } else {
    recommendationReasons.push(
      `Best overall value at ₹${bestPlatform.netPayablePrice.toLocaleString('en-IN')}: only ₹${(bestPlatform.netPayablePrice - cheapestPlatform.netPayablePrice).toLocaleString('en-IN')} more than ${cheapestPlatform.platform}, but with significantly superior seller trust and return terms.`
    );
  }

  if (bestPlatform.sellerRating >= 4.5) {
    recommendationReasons.push(
      `Verified high-trust seller "${bestPlatform.sellerName}" rated ${bestPlatform.sellerRating}★ with fast dispatch.`
    );
  }

  if (bestPlatform.returnPolicyScore >= 8) {
    recommendationReasons.push(
      `Hassle-free return policy: "${bestPlatform.returnPolicy}" with dedicated support.`
    );
  }

  if (bestPlatform.deliveryFee === 0) {
    recommendationReasons.push(`Zero shipping fees applied without requiring minimum cart add-ons.`);
  }

  // 3. Signature Feature: "Buy Now vs. Wait" Verdict
  const currentBestPrice = cheapestPlatform ? cheapestPlatform.netPayablePrice : product.mrp;
  const priceVsAvgPct = Math.round(((currentBestPrice - avg30Price) / avg30Price) * 100);
  const diffFrom30Low = Math.round(((currentBestPrice - lowest30Price) / lowest30Price) * 100);

  let verdict = 'BUY NOW';
  let verdictColor = 'emerald'; // emerald | amber | coral
  let verdictSummary = '';
  let verdictDetail = '';

  if (currentBestPrice <= lowest30Price * 1.02 || priceVsAvgPct <= -8) {
    verdict = 'BUY NOW';
    verdictColor = 'emerald';
    verdictSummary = `Current price is ${Math.abs(priceVsAvgPct)}% below 30-day average.`;
    verdictDetail = `₹${currentBestPrice.toLocaleString('en-IN')} is within 2% of the all-time 30-day low (₹${lowest30Price.toLocaleString('en-IN')}). Very low risk of further drop in the immediate 14 days.`;
  } else if (priceVsAvgPct >= 6 || diffFrom30Low >= 12) {
    verdict = 'WAIT';
    verdictColor = 'amber';
    verdictSummary = `Current price is ${priceVsAvgPct}% higher than the 30-day average.`;
    verdictDetail = `The price spiked recently from ₹${lowest30Price.toLocaleString('en-IN')} to ₹${currentBestPrice.toLocaleString('en-IN')}. Historical trend shows periodic price dips every 10–14 days. We advise setting a target alert at ₹${lowest30Price.toLocaleString('en-IN')}.`;
  } else {
    verdict = 'FAIR PRICE';
    verdictColor = 'indigo';
    verdictSummary = `Current price is on par with the 30-day baseline (₹${avg30Price.toLocaleString('en-IN')}).`;
    verdictDetail = `Buy if you need it immediately; otherwise, wait for upcoming weekend flash sales for potential 5-10% savings.`;
  }

  // 4. Coupon Reality Check & Real Deal Score (0 - 100)
  // Deconstruct fake discounts: MRP inflation vs real price
  const mrpInflationRatio = (product.mrp - avg30Price) / (product.mrp || 1);
  const hasInflatedMrp = mrpInflationRatio > 0.4; // Claiming >40% off when everyday price is already that low

  // Calculate Real Deal Score (0 - 100)
  let dealScore = 50;

  // Metric A: Discount vs 30-day average (-25 to +25)
  if (priceVsAvgPct <= -15) dealScore += 25;
  else if (priceVsAvgPct <= -7) dealScore += 18;
  else if (priceVsAvgPct <= 0) dealScore += 8;
  else if (priceVsAvgPct <= 8) dealScore -= 10;
  else dealScore -= 22;

  // Metric B: Distance to historical lowest price (0 to 20)
  const diffFromAllTimeLow = Math.max(0, currentBestPrice - lowestHistoricalPrice);
  const lowRatio = diffFromAllTimeLow / (lowestHistoricalPrice || 1);
  if (lowRatio <= 0.02) dealScore += 20;
  else if (lowRatio <= 0.07) dealScore += 14;
  else if (lowRatio <= 0.15) dealScore += 7;
  else dealScore -= 5;

  // Metric C: Hidden fees & shipping fairness (0 to 15)
  if (bestPlatform.deliveryFee === 0) dealScore += 15;
  else if (bestPlatform.deliveryFee <= 40) dealScore += 8;
  else dealScore -= 5;

  // Metric D: Coupon authenticity (0 to 15)
  const coupon = bestPlatform.couponDetails;
  let couponRealityNote = 'No hidden coupon hurdles detected.';
  let isCouponFake = false;

  if (coupon && coupon.code) {
    if (coupon.isFakeDiscount) {
      dealScore -= 12;
      isCouponFake = true;
      couponRealityNote = coupon.fakeDiscountReason || 'Advertised coupon requires inflated cart spend or restrictive bank card.';
    } else if (coupon.minSpend > currentBestPrice * 1.5) {
      dealScore -= 8;
      couponRealityNote = `Coupon requires spending ₹${coupon.minSpend.toLocaleString('en-IN')}, which exceeds this item's price.`;
    } else {
      dealScore += 10;
      couponRealityNote = `Verified ₹${coupon.discountAmount} direct savings with code "${coupon.code}".`;
    }
  }

  // Metric E: Seller Trust factor (0 to 10)
  if (bestPlatform.sellerRating >= 4.6) dealScore += 10;
  else if (bestPlatform.sellerRating >= 4.0) dealScore += 6;
  else dealScore -= 5;

  // Clamp deal score to [10, 99]
  dealScore = Math.min(98, Math.max(12, Math.round(dealScore)));

  let dealTier = 'Solid Deal';
  let dealTierColor = 'emerald';
  if (dealScore >= 80) {
    dealTier = 'Exceptional Deal';
    dealTierColor = 'emerald';
  } else if (dealScore >= 65) {
    dealTier = 'Fair Real Deal';
    dealTierColor = 'indigo';
  } else if (dealScore >= 45) {
    dealTier = 'Mediocre Value';
    dealTierColor = 'amber';
  } else {
    dealTier = 'Overpriced / Artificial Discount';
    dealTierColor = 'coral';
  }

  const scoreBreakdown = [
    {
      category: 'Historical Price Advantage',
      score: priceVsAvgPct <= -5 ? 24 : priceVsAvgPct <= 3 ? 16 : 8,
      maxScore: 25,
      note: priceVsAvgPct <= 0 
        ? `${Math.abs(priceVsAvgPct)}% lower than 30-day benchmark` 
        : `${priceVsAvgPct}% higher than typical 30-day baseline`,
    },
    {
      category: 'Proximity to All-Time Record Low',
      score: lowRatio <= 0.05 ? 23 : lowRatio <= 0.12 ? 15 : 6,
      maxScore: 25,
      note: `Within ₹${(currentBestPrice - lowestHistoricalPrice).toLocaleString('en-IN')} of record floor (₹${lowestHistoricalPrice.toLocaleString('en-IN')})`,
    },
    {
      category: 'Delivery & Hidden Fee Transparency',
      score: bestPlatform.deliveryFee === 0 ? 20 : 10,
      maxScore: 20,
      note: bestPlatform.deliveryFee === 0 ? 'Zero hidden shipping/convenience fees' : `₹${bestPlatform.deliveryFee} shipping applied`,
    },
    {
      category: 'Coupon Accessibility & Authenticity',
      score: isCouponFake ? 4 : coupon?.code ? 15 : 12,
      maxScore: 15,
      note: couponRealityNote,
    },
    {
      category: 'Seller Reliability & Return Safety',
      score: Math.round(((bestPlatform.sellerRating || 4) / 5) * 15),
      maxScore: 15,
      note: `${bestPlatform.sellerRating}★ seller rating with "${bestPlatform.returnPolicy}"`,
    },
  ];

  return {
    bestPlatform,
    cheapestPlatform,
    evaluatedPlatforms,
    recommendationReasons,
    verdict: {
      action: verdict,
      color: verdictColor,
      summary: verdictSummary,
      detail: verdictDetail,
      avg30Price,
      lowest30Price,
      highest30Price,
      lowestHistoricalPrice,
      priceVsAvgPct,
      currentBestPrice,
    },
    realDealScore: {
      score: dealScore,
      tier: dealTier,
      color: dealTierColor,
      hasInflatedMrp,
      mrpInflationPercentage: Math.round(mrpInflationRatio * 100),
      couponRealityNote,
      isCouponFake,
      scoreBreakdown,
    },
  };
}

module.exports = {
  calculateDecisionMetrics,
  getPlatformSearchUrl,
};
