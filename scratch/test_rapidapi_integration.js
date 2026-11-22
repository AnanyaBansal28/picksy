const { spawn } = require('child_process');
const path = require('path');

const PORT = 5991;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n====================================================');
  console.log('🚀 STARTING PICKSY RAPIDAPI INTEGRATION TESTS');
  console.log('====================================================\n');

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
    // ----------------------------------------------------
    // TEST 1: GET /api/products/live-search?q=boAt+Rockerz
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 1: Live Web Search across India (RapidAPI)');
    console.log('----------------------------------------------------');
    const liveRes = await fetch(`http://localhost:${PORT}/api/products/live-search?q=boAt+Rockerz+450`);
    console.log('Status:', liveRes.status);
    const liveData = await liveRes.json();
    console.log('Success:', liveData.success, 'isLiveWeb:', liveData.isLiveWeb, 'Count:', liveData.count);

    if (!liveData.success || !Array.isArray(liveData.products) || liveData.products.length === 0) {
      throw new Error('Live search did not return products');
    }

    const firstItem = liveData.products[0];
    console.log('Sample Product Title:', firstItem.title);
    console.log('Sample Image:', firstItem.image);
    console.log('Sample MRP:', firstItem.mrp, 'Lowest Price:', firstItem.lowestPrice);
    console.log('Stores count:', firstItem.platformListings?.length);
    console.log('Stores:', firstItem.platformListings?.map((p) => `${p.platform}: ₹${p.basePrice}`).join(' | '));
    console.log('Real Deal Score:', firstItem.decision?.realDealScore?.score);
    console.log('Verdict:', firstItem.decision?.verdict?.action);

    if (!firstItem.image || !firstItem.title || !firstItem.platformListings || firstItem.platformListings.length === 0) {
      throw new Error('Live product is missing key fields (image, title, or platformListings)');
    }
    console.log('>>> TEST 1 PASSED: Live Web Search returned rich Indian product data!\n');

    // ----------------------------------------------------
    // TEST 2: POST /api/products/analyze-url with Amazon URL
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 2: Analyze Pasted Amazon URL via RapidAPI');
    console.log('----------------------------------------------------');
    const analyzeRes = await fetch(`http://localhost:${PORT}/api/products/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.amazon.in/Noise-Colorfit-Pulse-Smartwatch-Monitoring/dp/B097R25DPX?crid=123&dib=xyz',
      }),
    });
    console.log('Status:', analyzeRes.status);
    const analyzeData = await analyzeRes.json();
    console.log('Success:', analyzeData.success, 'isLiveApi:', analyzeData.isLiveApi);
    console.log('Analyzed Title:', analyzeData.product?.title);
    console.log('Analyzed Image:', analyzeData.product?.image);
    console.log('Analyzed MRP:', analyzeData.product?.mrp);
    console.log('Platforms:', analyzeData.product?.platformListings?.map((p) => `${p.platform}: ₹${p.basePrice} (${p.productUrl})`));
    console.log('Amazon URL preserved:', analyzeData.product?.platformListings?.find((p) => p.platform === 'Amazon')?.productUrl);

    if (!analyzeData.success || !analyzeData.product) {
      throw new Error('Analyze URL failed');
    }
    const amazonPlatform = analyzeData.product.platformListings.find((p) => p.platform === 'Amazon');
    if (!amazonPlatform || !amazonPlatform.productUrl.includes('dp/B097R25DPX')) {
      throw new Error('Amazon canonical URL was not preserved for the Amazon listing!');
    }
    console.log('>>> TEST 2 PASSED: Pasted link analyzed with live RapidAPI data & preserved canonical URL!\n');

    // ----------------------------------------------------
    // TEST 3: Safe Fallback when Query is gibberish or offline
    // ----------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('TEST 3: Safe Fallback Verification (No 500 Errors)');
    console.log('----------------------------------------------------');
    const fallbackRes = await fetch(`http://localhost:${PORT}/api/products/live-search?q=xyznonexistentitem9999`);
    console.log('Fallback Status:', fallbackRes.status);
    const fallbackData = await fallbackRes.json();
    console.log('Fallback Response:', fallbackData);
    if (!fallbackRes.ok && fallbackRes.status === 500) {
      throw new Error('Server returned 500 on missing/fallback query');
    }
    console.log('>>> TEST 3 PASSED: Fallback handled gracefully!\n');

    console.log('🎉 ALL RAPIDAPI INTEGRATION TESTS PASSED 100%!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    serverProcess.kill();
  }
}

runTests();
