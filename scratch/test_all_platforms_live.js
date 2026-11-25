require('../backend/node_modules/dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const {
  parseInrPrice,
  cleanMetaTitle,
  extractProductIdentifiersFromUrl,
} = require('../backend/utils/rapidApiService');
const productController = require('../backend/controllers/productController');

console.log('=== TEST 1: Price Parsing Unit Tests ===');
const priceTests = [
  { input: '₹37,990.00', expected: 37990 },
  { input: '₹296', expected: 296 },
  { input: 'Rs. 1,499.00', expected: 1499 },
  { input: '52% off₹3,990', expected: 3990 },
  { input: 37990, expected: 37990 },
  { input: '₹ 24,989', expected: 24989 },
];

for (const { input, expected } of priceTests) {
  const parsed = parseInrPrice(input);
  console.log(`parseInrPrice("${input}") = ${parsed} (Expected: ${expected})`);
  if (parsed !== expected) {
    throw new Error(`Failed price parse for ${input}! Got ${parsed}, expected ${expected}`);
  }
}

console.log('\n=== TEST 2: Title & HTML Entity Cleaning Unit Tests ===');
const titleTests = [
  {
    input: 'Buy Apple iPhone 15 (128 GB) - Black Online at Low Prices in India - Amazon.in',
    expected: 'Apple iPhone 15 (128 GB) - Black',
  },
  {
    input: 'Apple iPhone 15 (Black, 128 GB) | Flipkart.com',
    expected: 'Apple iPhone 15 (Black, 128 GB)',
  },
  {
    input: 'GoSriKi Women&#39;s Rayon Viscose Straight Printed Kurta &amp; Pant Set',
    expected: "GoSriKi Women's Rayon Viscose Straight Printed Kurta & Pant Set",
  },
  {
    input: 'Roadster Men Black Casual Shirt | Myntra',
    expected: 'Roadster Men Black Casual Shirt',
  },
];

for (const { input, expected } of titleTests) {
  const cleaned = cleanMetaTitle(input);
  console.log(`cleanMetaTitle("${input}")\n  -> "${cleaned}" (Expected: "${expected}")`);
  if (cleaned !== expected) {
    throw new Error(`Failed title clean for ${input}! Got "${cleaned}"`);
  }
}

console.log('\n=== TEST 3: URL Identifier Extraction Unit Tests ===');
const urlTests = [
  {
    url: 'https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH',
    expectedAsin: 'B09XS7JWHH',
    expectedPlatform: 'Amazon',
  },
  {
    url: 'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W',
    expectedPid: 'MOBGTAGPTB3VS24W',
    expectedPlatform: 'Flipkart',
  },
  {
    url: 'https://www.myntra.com/shirts/roadster/roadster-men-black-pure-cotton-casual-shirt/13735766/buy',
    expectedPid: '13735766',
    expectedPlatform: 'Myntra',
  },
  {
    url: 'https://www.tatacliq.com/apple-iphone-15-128-gb-black/p-mp00000001928374',
    expectedPid: 'mp00000001928374',
    expectedPlatform: 'Tata CliQ',
  },
];

for (const { url, expectedAsin, expectedPid, expectedPlatform } of urlTests) {
  const ids = extractProductIdentifiersFromUrl(url);
  console.log(`URL: ${url}`);
  console.log(`  -> ASIN: ${ids.asin || 'N/A'}, PID: ${ids.pid || 'N/A'}, Platform: ${ids.platform}, Slug: "${ids.cleanSlug}"`);
  if (expectedAsin && ids.asin !== expectedAsin) throw new Error(`ASIN mismatch for ${url}`);
  if (expectedPid && ids.pid !== expectedPid) throw new Error(`PID mismatch for ${url}`);
  if (expectedPlatform && ids.platform !== expectedPlatform) throw new Error(`Platform mismatch for ${url}`);
}

console.log('\n=== TEST 4: Live URL Analysis End-to-End Tests ===');
async function testAnalyzeUrlLive(url, label) {
  const req = { body: { url } };
  let responseData = null;
  const res = {
    status: (code) => ({
      json: (data) => {
        responseData = { statusCode: code, ...data };
        return responseData;
      },
    }),
    json: (data) => {
      responseData = data;
      return responseData;
    },
  };

  await productController.analyzeUrl(req, res, (err) => {
    if (err) throw err;
  });

  console.log(`\n--- Result for [${label}] ---`);
  console.log('Success:', responseData.success);
  console.log('Live API matched:', responseData.isLiveApi);
  console.log('Title:', responseData.product.title);
  console.log('SubCategory:', responseData.product.subCategory);
  console.log('Lowest Price:', responseData.product.lowestPrice);
  console.log('Image URL:', responseData.product.image);
  console.log('Store listings count:', responseData.product.platformListings?.length);
  if (responseData.product.platformListings) {
    responseData.product.platformListings.forEach((p) => {
      console.log(`   * ${p.platform}: ₹${p.basePrice} (${p.sellerName})`);
    });
  }

  // Ensure no flat 200/500 placeholder
  if (!responseData.success) throw new Error(`Request failed for ${label}`);
  if (responseData.product.lowestPrice <= 0) throw new Error(`Invalid price for ${label}`);
  return responseData.product;
}

async function runLiveTests() {
  // Test 1: Sony Headphones on Amazon
  await testAnalyzeUrlLive(
    'https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH',
    'Amazon Sony WH-1000XM5'
  );

  // Test 2: Roadster Shirt on Myntra
  await testAnalyzeUrlLive(
    'https://www.myntra.com/shirts/roadster/roadster-men-black-pure-cotton-casual-shirt/13735766/buy',
    'Myntra Roadster Shirt'
  );

  console.log('\nAll unit & live URL analysis tests passed with flying colors!');
}

runLiveTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
