const { spawn } = require('child_process');
const path = require('path');
const {
  cleanProductSlug,
  pickBestMatchingProduct,
  isInflatedReseller,
  isAuthenticIndianStore,
} = require('../backend/utils/rapidApiService');

const PORT = 5990;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n====================================================');
  console.log('🎯 TESTING RAPIDAPI MATCHING ACCURACY & RESELLER FILTERING');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // UNIT TEST 1: Smarter Slug & Dimension Extraction
  // ----------------------------------------------------
  console.log('----------------------------------------------------');
  console.log('UNIT TEST 1: Slug Cleaning & Dimension Separation');
  console.log('----------------------------------------------------');
  const sample1 = cleanProductSlug('SCOOBA-Fabric-Piggy-toy20cm-Height');
  console.log('Input: "SCOOBA-Fabric-Piggy-toy20cm-Height"');
  console.log('Output:', sample1);

  if (!sample1.includes('20 cm') || !sample1.includes('toy')) {
    throw new Error(`Failed to separate attached dimensions: got "${sample1}"`);
  }

  const sample2 = cleanProductSlug('boAt-Rockerz-450-Wireless-Earphone40mm');
  console.log('Input: "boAt-Rockerz-450-Wireless-Earphone40mm"');
  console.log('Output:', sample2);
  if (!sample2.includes('40 mm') || !sample2.includes('boAt')) {
    throw new Error(`Failed to preserve brand & split mm: got "${sample2}"`);
  }
  console.log('>>> UNIT TEST 1 PASSED: Attached numbers and dimensions cleaned cleanly!\n');

  // ----------------------------------------------------
  // UNIT TEST 2: Filter Out Inflated Import Sites (Desertcart)
  // ----------------------------------------------------
  console.log('----------------------------------------------------');
  console.log('UNIT TEST 2: Desertcart / Ubuy Filtering & Brand Match');
  console.log('----------------------------------------------------');
  const mockApiCandidates = [
    {
      product_title: 'SCOOBA Fabric Piggy Toy 20cm Height Soft Doll',
      store_name: 'Desertcart',
      price: '₹4,999',
      product_page_url: 'https://www.desertcart.in/products/12345',
      product_photos: ['https://photo1.jpg'],
    },
    {
      product_title: 'SCOOBA Fabric Piggy Toy 20cm Height Soft Plush Doll for Kids',
      store_name: 'Amazon.in',
      price: '₹349',
      product_page_url: 'https://www.amazon.in/dp/B0XYZ',
      product_photos: ['https://photo2.jpg'],
    },
    {
      product_title: 'Generic Soft Piggy Doll 20cm',
      store_name: 'Flipkart',
      price: '₹299',
      product_page_url: 'https://www.flipkart.com/p/itm123',
    },
  ];

  const chosen = pickBestMatchingProduct(mockApiCandidates, {
    detectedPlatform: 'Amazon',
    cleanSlug: sample1,
  });

  console.log('Candidate 1: Desertcart (₹4,999)');
  console.log('Candidate 2: Amazon.in (₹349)');
  console.log('Candidate 3: Flipkart (₹299)');
  console.log('Selected:', chosen.product_title, 'from', chosen.store_name, 'at', chosen.price);

  if (chosen.store_name.toLowerCase().includes('desertcart')) {
    throw new Error('Failed! Desertcart was selected instead of domestic Indian platform!');
  }
  if (!chosen.store_name.toLowerCase().includes('amazon') || chosen.price !== '₹349') {
    throw new Error(`Expected Amazon.in at ₹349, got ${chosen.store_name} at ${chosen.price}`);
  }
  console.log('>>> UNIT TEST 2 PASSED: Desertcart excluded, authentic Indian Amazon.in offer selected!\n');

  // ----------------------------------------------------
  // INTEGRATION TEST 3: Live POST /api/products/analyze-url
  // ----------------------------------------------------
  console.log('----------------------------------------------------');
  console.log('INTEGRATION TEST 3: Live URL Analysis with Query Formulation');
  console.log('----------------------------------------------------');

  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '../backend'),
    env: {
      ...process.env,
      PORT: String(PORT),
    },
    stdio: 'inherit',
  });

  await wait(2500);

  try {
    const res = await fetch(`http://localhost:${PORT}/api/products/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.amazon.in/SCOOBA-Fabric-Piggy-toy20cm-Height/dp/B08XYS1234?crid=test&dib=test',
      }),
    });

    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Success:', data.success);
    console.log('Analyzed Title:', data.product?.title);
    console.log('Detected Brand:', data.product?.brand);
    console.log('Lowest Price (₹):', data.product?.lowestPrice);
    console.log('Platform Stores:', data.product?.platformListings?.map((p) => `${p.platform}: ₹${p.basePrice}`));

    if (!data.success || !data.product) {
      throw new Error('Failed to analyze URL');
    }

    // Ensure price is realistic Indian pricing (NOT Desertcart ₹5,000+ for a 20cm toy)
    if (data.product.lowestPrice > 3000) {
      throw new Error(`Unrealistic inflated import price detected: ₹${data.product.lowestPrice}`);
    }

    // Ensure no Desertcart in platform listings
    const hasDesertcart = data.product.platformListings?.some((p) =>
      p.platform.toLowerCase().includes('desertcart')
    );
    if (hasDesertcart) {
      throw new Error('Platform listings contain Desertcart!');
    }

    // Ensure Amazon canonical link is preserved
    const amazonPlatform = data.product.platformListings?.find((p) => p.platform === 'Amazon');
    if (!amazonPlatform || !amazonPlatform.productUrl.includes('dp/B08XYS1234')) {
      throw new Error('Amazon canonical URL was not preserved');
    }

    console.log('>>> INTEGRATION TEST 3 PASSED: Exact Indian product & price matched with zero Desertcart inflation!\n');
    console.log('🎉 ALL ACCURACY & RESELLER FILTERING TESTS PASSED 100%!\n');
  } finally {
    serverProcess.kill();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exitCode = 1;
});

