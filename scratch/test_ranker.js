const INFLATED_IMPORT_SITES = [
  'desertcart',
  'ubuy',
  'ebay',
  'fishpond',
  'grandado',
  'fruugo',
  'u-buy',
  'desert-cart',
];

const AUTHENTIC_INDIAN_PLATFORMS = [
  'amazon',
  'amazon.in',
  'flipkart',
  'tatacliq',
  'tata cliq',
  'firstcry',
  'meesho',
  'jiomart',
  'croma',
  'reliance',
  'reliance digital',
  'myntra',
  'nykaa',
  'blinkit',
  'zepto',
  'instamart',
];

function isInflatedReseller(product) {
  const store = String(product.store_name || product.offer?.store_name || '').toLowerCase();
  const pageUrl = String(product.product_page_url || product.offer?.offer_page_url || '').toLowerCase();

  for (const site of INFLATED_IMPORT_SITES) {
    if (store.includes(site) || pageUrl.includes(site)) {
      return true;
    }
  }
  return false;
}

function isAuthenticIndianStore(product) {
  const store = String(product.store_name || product.offer?.store_name || '').toLowerCase();
  const pageUrl = String(product.product_page_url || product.offer?.offer_page_url || '').toLowerCase();

  for (const plat of AUTHENTIC_INDIAN_PLATFORMS) {
    if (store.includes(plat) || pageUrl.includes(plat)) {
      return true;
    }
  }
  return false;
}

function cleanProductSlug(rawSlug) {
  if (!rawSlug) return '';
  let str = decodeURIComponent(rawSlug);
  str = str.replace(/([a-z]{2,})([A-Z][a-z]+)/g, '$1 $2');
  str = str.replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
  str = str.replace(/(\d+)([a-zA-Z]+)/g, '$1 $2');
  str = str.replace(/[-_+/.]/g, ' ');
  str = str.replace(/\bbo At\b/gi, 'boAt');
  return str.replace(/\s+/g, ' ').trim();
}

function pickBestMatchingProduct(products, { detectedPlatform = 'Amazon', cleanSlug = '' } = {}) {
  if (!products || products.length === 0) return null;

  // Filter out inflated import sites if authentic Indian or non-import platforms are available
  const nonInflated = products.filter((p) => !isInflatedReseller(p));
  const candidatePool = nonInflated.length > 0 ? nonInflated : products;

  const targetPlatformLower = detectedPlatform.toLowerCase();
  const slugWords = cleanSlug
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !['the', 'and', 'with', 'for', 'in', 'height'].includes(w));

  const brandWord = slugWords[0] || '';
  const numbersInSlug = cleanSlug.match(/\d+(?:\s*[a-zA-Z]+)?/g) || [];

  const scored = candidatePool.map((product) => {
    let score = 0;
    const titleLower = String(product.product_title || product.title || '').toLowerCase();
    const storeLower = String(product.store_name || product.offer?.store_name || '').toLowerCase();

    // 1. Direct platform match
    if (targetPlatformLower.includes('amazon') && storeLower.includes('amazon')) {
      score += 100;
    } else if (targetPlatformLower.includes('flipkart') && storeLower.includes('flipkart')) {
      score += 100;
    } else if (storeLower.includes(targetPlatformLower)) {
      score += 80;
    }

    // 2. Authentic Indian platform bonus
    if (isAuthenticIndianStore(product)) {
      score += 40;
    }

    // 3. Penalize inflated reseller if it wasn't filtered
    if (isInflatedReseller(product)) {
      score -= 150;
    }

    // 4. Brand match (first word of slug like "SCOOBA", "Noise", "boAt")
    if (brandWord && titleLower.includes(brandWord)) {
      score += 60;
    }

    // 5. Keyword overlap
    let matchedKeywords = 0;
    for (const word of slugWords) {
      if (titleLower.includes(word)) {
        matchedKeywords++;
        score += 12;
      }
    }

    // 6. Number / Dimension match (e.g. 20 cm, 128 gb, 450)
    for (const num of numbersInSlug) {
      const cleanNum = num.replace(/\s+/g, '').toLowerCase();
      if (titleLower.replace(/\s+/g, '').includes(cleanNum)) {
        score += 25;
      }
    }

    // 7. Product photo presence
    if (product.product_photos && product.product_photos.length > 0) {
      score += 10;
    }

    return { product, score, storeLower, title: product.product_title };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.product || products[0];
}

// TEST CASES
const sampleApiResults = [
  {
    product_title: 'SCOOBA Fabric Piggy Toy 20cm Height Soft Plush',
    store_name: 'Desertcart',
    price: '₹4,999',
    product_page_url: 'https://desertcart.in/...',
  },
  {
    product_title: 'SCOOBA Fabric Piggy Toy 20cm Height Soft Plush Doll',
    store_name: 'Amazon.in',
    price: '₹349',
    product_page_url: 'https://amazon.in/...',
    product_photos: ['https://photo.jpg'],
  },
  {
    product_title: 'Generic Soft Toy 20cm',
    store_name: 'Flipkart',
    price: '₹299',
  },
];

const best = pickBestMatchingProduct(sampleApiResults, {
  detectedPlatform: 'Amazon',
  cleanSlug: cleanProductSlug('SCOOBA-Fabric-Piggy-toy20cm-Height'),
});

console.log('Clean Slug:', cleanProductSlug('SCOOBA-Fabric-Piggy-toy20cm-Height'));
console.log('Selected Product:', best.product_title, 'from', best.store_name, 'at', best.price);

