const { extractProductQueryFromUrl, pickBestMatchingProduct } = require('../backend/utils/rapidApiService');
const productController = require('../backend/controllers/productController');

console.log('--- 1. Testing extractProductQueryFromUrl ---');
const amazonUrl = 'https://www.amazon.in/GoSriKi-Women-Rayon-Viscose-Printed/dp/B0BXYZ123';
const flipkartUrl = 'https://www.flipkart.com/collective-stitch-wool-embroidered-women-shawl/p/itm123456789?pid=SHW123';
const toyUrl = 'https://www.amazon.in/SCOOBA-Fabric-Piggy-toy20cm-Height/dp/B08XYS1234';

const q1 = extractProductQueryFromUrl(amazonUrl);
const q2 = extractProductQueryFromUrl(flipkartUrl);
const q3 = extractProductQueryFromUrl(toyUrl);

console.log('Amazon GoSriKi Query:', q1);
console.log('Flipkart Shawl Query:', q2);
console.log('Toy Query:', q3);

if (q1 !== 'GoSriKi Women Rayon Viscose Printed') {
  throw new Error(`Expected 'GoSriKi Women Rayon Viscose Printed' but got '${q1}'`);
}
if (q2 !== 'collective stitch wool embroidered women shawl') {
  throw new Error(`Expected 'collective stitch wool embroidered women shawl' but got '${q2}'`);
}
if (!q3.includes('SCOOBA') || !q3.includes('toy 20 cm')) {
  throw new Error(`Expected SCOOBA and toy 20 cm but got '${q3}'`);
}

console.log('--- 2. Testing pickBestMatchingProduct with Clothing Query ---');
const candidatesWithSuitAndEarbuds = [
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

const bestCandidate = pickBestMatchingProduct(candidatesWithSuitAndEarbuds, {
  detectedPlatform: 'Amazon',
  cleanSlug: q1,
});

console.log('Selected Candidate:', bestCandidate ? bestCandidate.product_title : 'None');
if (!bestCandidate || !bestCandidate.product_title.includes('GoSriKi')) {
  throw new Error(`Failed to pick GoSriKi kurta! Picked: ${bestCandidate?.product_title}`);
}

console.log('--- 3. Testing pickBestMatchingProduct with ONLY Earbuds returned ---');
const candidatesOnlyEarbuds = [
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
];

const candidateWhenOnlyEarbuds = pickBestMatchingProduct(candidatesOnlyEarbuds, {
  detectedPlatform: 'Amazon',
  cleanSlug: q1,
});

console.log('Selected Candidate when only earbuds returned:', candidateWhenOnlyEarbuds ? candidateWhenOnlyEarbuds.product_title : 'None (Correct!)');
if (candidateWhenOnlyEarbuds !== null) {
  throw new Error(`Expected null when only earbuds returned for clothing query, but got: ${candidateWhenOnlyEarbuds.product_title}`);
}

console.log('--- 4. Testing analyzeUrl Handler Execution ---');
async function testAnalyzeUrl() {
  const req = {
    body: {
      url: amazonUrl,
    },
  };
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

  console.log('Response Success:', responseData.success);
  console.log('Product Title:', responseData.product.title);
  console.log('Product Category:', responseData.product.category);
  console.log('Product SubCategory:', responseData.product.subCategory);
  console.log('Lowest Price:', responseData.product.lowestPrice);
  console.log('Brand:', responseData.product.brand);
  console.log('Canonical URL:', responseData.canonicalUrl);
  console.log('Platform listings count:', responseData.product.platformListings?.length);

  // Assertions
  if (!responseData.product.title.toLowerCase().includes('gosriki')) {
    throw new Error(`Title does not include GoSriKi: ${responseData.product.title}`);
  }
  if (responseData.product.title.toLowerCase().includes('buds') || responseData.product.title.toLowerCase().includes('earbuds')) {
    throw new Error(`Returned earbuds for clothing URL! Title: ${responseData.product.title}`);
  }
  if (responseData.product.subCategory !== 'Footwear & Fashion') {
    throw new Error(`Expected Footwear & Fashion subCategory, got: ${responseData.product.subCategory}`);
  }
  if (responseData.product.lowestPrice > 2000) {
    throw new Error(`Price seems unrealistically high for a suit (${responseData.product.lowestPrice})`);
  }
  console.log('\nAll tests passed successfully!');
}

testAnalyzeUrl().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
