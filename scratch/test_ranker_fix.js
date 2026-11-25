const mockResults = [
  {
    product_title: 'Samsung Galaxy Buds2 Pro True Wireless Earbuds',
    store_name: 'Amazon.in',
    price: '₹9,999',
  },
  {
    product_title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds',
    store_name: 'Amazon.in',
    price: '₹1,299',
  },
  {
    product_title: "GoSriKi Women's Rayon Viscose Straight Printed Kurta with Pant & Dupatta",
    store_name: 'Amazon.in',
    price: '₹349',
  },
];

function pickBestMatchingProductTest(products, { detectedPlatform = 'Amazon', cleanSlug = '' } = {}) {
  if (!Array.isArray(products) || products.length === 0) return null;

  const targetPlatformLower = String(detectedPlatform || '').toLowerCase();
  const slugWords = cleanSlug
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !['the', 'and', 'with', 'for', 'in', 'height', 'of', 'to'].includes(w));

  const brandWord = slugWords[0] || '';
  const numbersInSlug = cleanSlug.match(/\d+(?:\s*[a-zA-Z]+)?/g) || [];

  const queryIsClothing = /\b(suit|suits|kurta|kurtas|kurti|kurtis|saree|sarees|shawl|shawls|dupatta|rayon|viscose|printed|fabric|dress|dresses|clothing|apparel|ethnic|women|womens|men|mens|shirt|tshirt|jeans|trousers|top|pant|pants)\b/i.test(cleanSlug);

  const scored = products.map((product) => {
    let score = 0;
    const titleLower = String(product.product_title || product.title || '').toLowerCase();
    const storeLower = String(product.store_name || product.offer?.store_name || '').toLowerCase();

    // 1. Mandatory keyword overlap
    let matchedKeywordsCount = 0;
    for (const word of slugWords) {
      if (titleLower.includes(word)) {
        matchedKeywordsCount++;
        score += 20;
      }
    }

    if (matchedKeywordsCount === 0) {
      return { product, score: -999 };
    }

    // 2. Disqualify cross-category mismatch
    const candidateIsAudioOrPhone = /\b(earbuds|earbud|earphone|earphones|headphone|headphones|buds|airpods|neckband|phone|smartphone|mobile|galaxy\s*s\d|iphone)\b/i.test(titleLower);
    if (queryIsClothing && candidateIsAudioOrPhone) {
      return { product, score: -999 };
    }

    // 3. Direct platform match
    if (targetPlatformLower.includes('amazon') && storeLower.includes('amazon')) {
      score += 50;
    } else if (targetPlatformLower.includes('flipkart') && storeLower.includes('flipkart')) {
      score += 50;
    } else if (storeLower.includes(targetPlatformLower)) {
      score += 30;
    }

    // 4. Brand match (e.g. GoSriKi)
    if (brandWord && (titleLower.includes(brandWord) || titleLower.startsWith(brandWord))) {
      score += 80;
    }

    // 5. Dimension / Number match
    for (const num of numbersInSlug) {
      const cleanNum = num.replace(/\s+/g, '').toLowerCase();
      if (titleLower.replace(/\s+/g, '').includes(cleanNum)) {
        score += 25;
      }
    }

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score <= 0) return null;
  return best.product;
}

const chosen = pickBestMatchingProductTest(mockResults, {
  detectedPlatform: 'Amazon',
  cleanSlug: 'GoSriKi Women Rayon Viscose Printed',
});

console.log('Chosen:', chosen ? chosen.product_title : 'None');

// Test when RapidAPI only returns earbuds for a clothing query:
const earbudsOnly = [
  {
    product_title: 'Samsung Galaxy Buds2 Pro True Wireless Earbuds',
    store_name: 'Amazon.in',
    price: '₹9,999',
  },
];

const chosen2 = pickBestMatchingProductTest(earbudsOnly, {
  detectedPlatform: 'Amazon',
  cleanSlug: 'GoSriKi Women Rayon Viscose Printed',
});

console.log('When only earbuds returned, chosen is:', chosen2 ? chosen2.product_title : 'NULL (Correct!)');
