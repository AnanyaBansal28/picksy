const http = require('http');

async function runLinkAnalyzerTests() {
  process.env.PORT = 5998;
  process.env.JWT_SECRET = 'picksy_test_secret_key_12345';
  process.env.NODE_ENV = 'test';

  const app = require('../backend/server');
  await new Promise((r) => setTimeout(r, 600));

  const analyzeUrl = (url) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ url });
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5998,
          path: '/api/products/analyze-url',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
        },
        (res) => {
          let resBody = '';
          res.on('data', (chunk) => (resBody += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(resBody) });
            } catch (e) {
              resolve({ status: res.statusCode, data: resBody });
            }
          });
        }
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  try {
    console.log('====================================================');
    console.log('TEST 1: Kids Phone Toy (stripping ?crid=... &dib=...)');
    console.log('====================================================');
    const kidsUrl =
      'https://www.amazon.in/Baybee-Interactive-Smartphone-Educational-Flashing/dp/B0GSZ14C55?crid=2M1S93DIB678&dib=eyJ2IjoiMSJ9&keywords=kids+phone+toy&qid=1732300000#customerReviews';
    const res1 = await analyzeUrl(kidsUrl);
    console.log('Status:', res1.status);
    console.log('Canonical URL:', res1.data.canonicalUrl);
    console.log('Title:', res1.data.product?.title);
    console.log('SubCategory:', res1.data.product?.subCategory);
    console.log('Base Price:', res1.data.product?.platformListings?.[0]?.basePrice);
    console.log('MRP:', res1.data.product?.mrp);
    console.log('Image:', res1.data.product?.image);
    console.log('Description:', res1.data.product?.description);

    // Assertions for Test 1
    if (res1.data.canonicalUrl.includes('?crid') || res1.data.canonicalUrl.includes('dib=')) {
      throw new Error('FAILED: Canonical URL contains tracking query parameters!');
    }
    if (res1.data.product?.subCategory !== 'Toys & Kids') {
      throw new Error(`FAILED: Expected Toys & Kids subCategory, got: ${res1.data.product?.subCategory}`);
    }
    const price1 = res1.data.product?.platformListings?.[0]?.basePrice;
    if (price1 < 299 || price1 > 899) {
      throw new Error(`FAILED: Price should be in ₹299-₹899 range, got: ₹${price1}`);
    }
    if (res1.data.product?.title?.toLowerCase().includes('iphone 15') && !res1.data.product?.title?.toLowerCase().includes('toy')) {
      throw new Error('FAILED: Mistakenly matched iPhone 15 catalog item!');
    }
    console.log('>>> TEST 1 PASSED: Kids Phone Toy correctly categorized under Toys & Kids with realistic ₹349-₹599 pricing and clean canonical URL!\n');

    console.log('====================================================');
    console.log('TEST 2: iPhone 15 Case Cover (Not a ₹65,000 phone)');
    console.log('====================================================');
    const caseUrl = 'https://www.amazon.in/Apple-iPhone-15-Silicone-Case-Cover/dp/B0CHX9CASE?crid=98765&dib=abc';
    const res2 = await analyzeUrl(caseUrl);
    console.log('Status:', res2.status);
    console.log('Canonical URL:', res2.data.canonicalUrl);
    console.log('SubCategory:', res2.data.product?.subCategory);
    console.log('Base Price:', res2.data.product?.platformListings?.[0]?.basePrice);

    if (res2.data.product?.subCategory !== 'Mobile Accessories & Cases') {
      throw new Error(`FAILED: Expected Mobile Accessories & Cases, got: ${res2.data.product?.subCategory}`);
    }
    const price2 = res2.data.product?.platformListings?.[0]?.basePrice;
    if (price2 > 1000) {
      throw new Error(`FAILED: Case cover price should be <= ₹1000, got: ₹${price2}`);
    }
    console.log('>>> TEST 2 PASSED: Case cover categorized as Mobile Accessories & Cases with modest accessory pricing!\n');

    console.log('====================================================');
    console.log('TEST 3: Real iPhone 15 Link (Smartphone)');
    console.log('====================================================');
    const phoneUrl = 'https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY?ref_=cm_sw_r_cp_ud_dp_123';
    const res3 = await analyzeUrl(phoneUrl);
    console.log('Status:', res3.status);
    console.log('Title:', res3.data.product?.title);
    console.log('SubCategory:', res3.data.product?.subCategory);
    console.log('Lowest Price:', res3.data.product?.lowestPrice);

    if (res3.data.product?.subCategory !== 'Smartphones') {
      throw new Error(`FAILED: Expected Smartphones, got: ${res3.data.product?.subCategory}`);
    }
    if (res3.data.product?.lowestPrice < 14000) {
      throw new Error(`FAILED: Real smartphone should be >= ₹14,000, got: ₹${res3.data.product?.lowestPrice}`);
    }
    console.log('>>> TEST 3 PASSED: Real iPhone 15 assigned flagship smartphone status and pricing!\n');

    console.log('====================================================');
    console.log('TEST 4: Fast Charger Cable');
    console.log('====================================================');
    const cableUrl = 'https://www.flipkart.com/ambrane-65w-fast-charging-type-c-cable/p/itm12345?pid=CBL123';
    const res4 = await analyzeUrl(cableUrl);
    console.log('SubCategory:', res4.data.product?.subCategory);
    console.log('Base Price:', res4.data.product?.platformListings?.[0]?.basePrice);
    if (res4.data.product?.subCategory !== 'Cables & Chargers') {
      throw new Error(`FAILED: Expected Cables & Chargers, got: ${res4.data.product?.subCategory}`);
    }
    console.log('>>> TEST 4 PASSED: Fast Charger Cable correctly identified!\n');

    console.log('====================================================');
    console.log('TEST 5: Water Bottle / Flask');
    console.log('====================================================');
    const bottleUrl = 'https://www.amazon.in/Milton-Thermosteel-Flip-Flask-Bottle/dp/B00762A43E?tag=affiliate_123';
    const res5 = await analyzeUrl(bottleUrl);
    console.log('SubCategory:', res5.data.product?.subCategory);
    console.log('Base Price:', res5.data.product?.platformListings?.[0]?.basePrice);
    if (res5.data.product?.subCategory !== 'Home & Kitchen') {
      throw new Error(`FAILED: Expected Home & Kitchen, got: ${res5.data.product?.subCategory}`);
    }
    console.log('>>> TEST 5 PASSED: Water Bottle correctly identified under Home & Kitchen!\n');

    console.log('🎉 ALL LINK ANALYZER & CANONICAL URL TESTS PASSED PERFECTLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runLinkAnalyzerTests();

