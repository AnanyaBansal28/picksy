const http = require('http');

async function runOutboundTests() {
  process.env.PORT = 5996;
  process.env.JWT_SECRET = 'picksy_test_secret_key_12345';
  process.env.NODE_ENV = 'test';

  const app = require('../backend/server');
  await new Promise((r) => setTimeout(r, 600));

  const makeReq = (method, path, body = null) => {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5996,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          },
        },
        (res) => {
          let resBody = '';
          res.on('data', (c) => (resBody += c));
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
      if (data) req.write(data);
      req.end();
    });
  };

  try {
    console.log('====================================================');
    console.log('TEST 1: Seeded Catalog Item (e.g. iPhone 15)');
    console.log('====================================================');
    const prodsRes = await makeReq('GET', '/api/products');
    const iphone = prodsRes.data.products?.find((p) => (p.title || '').includes('iPhone 15'));
    console.log('Catalog Product:', iphone?.title);
    
    const decisionListings = iphone?.decision?.evaluatedPlatforms || iphone?.platformListings || [];
    console.log('Evaluated Platforms Outbound Links:');
    decisionListings.forEach((l) => console.log(`  - ${l.platform}: ${l.productUrl}`));

    const amz = decisionListings.find((l) => l.platform.toLowerCase().includes('amazon'));
    const fk = decisionListings.find((l) => l.platform.toLowerCase().includes('flipkart'));
    const tata = decisionListings.find((l) => l.platform.toLowerCase().includes('tata'));

    if (!amz?.productUrl.startsWith('https://www.amazon.in/s?k=')) {
      throw new Error(`FAILED: Amazon URL should be search URL, got: ${amz?.productUrl}`);
    }
    if (!fk?.productUrl.startsWith('https://www.flipkart.com/search?q=')) {
      throw new Error(`FAILED: Flipkart URL should be search URL, got: ${fk?.productUrl}`);
    }
    if (!tata?.productUrl.startsWith('https://www.tatacliq.com/search/?searchCategory=all&text=')) {
      throw new Error(`FAILED: Tata CLiQ URL should be search URL, got: ${tata?.productUrl}`);
    }
    console.log('>>> TEST 1 PASSED: Seeded catalog items use 100% working search URLs!\n');

    console.log('====================================================');
    console.log('TEST 2: Real Pasted Amazon URL (Toys & Kids item)');
    console.log('====================================================');
    const pastedAmz = 'https://www.amazon.in/Baybee-Interactive-Smartphone-Educational-Flashing/dp/B0GSZ14C55?crid=XYZ123';
    const amzRes = await makeReq('POST', '/api/products/analyze-url', { url: pastedAmz });
    const amzListings = amzRes.data.product?.decision?.evaluatedPlatforms || amzRes.data.product?.platformListings || [];
    console.log('Pasted Amazon item platforms:');
    amzListings.forEach((l) => console.log(`  - ${l.platform}: ${l.productUrl}`));

    const pastedAmzListing = amzListings.find((l) => l.platform.toLowerCase().includes('amazon'));
    const pastedFkListing = amzListings.find((l) => l.platform.toLowerCase().includes('flipkart'));
    const pastedTataListing = amzListings.find((l) => l.platform.toLowerCase().includes('tata'));

    if (pastedAmzListing?.productUrl !== 'https://www.amazon.in/Baybee-Interactive-Smartphone-Educational-Flashing/dp/B0GSZ14C55') {
      throw new Error(`FAILED: Amazon should preserve exact pasted clean URL, got: ${pastedAmzListing?.productUrl}`);
    }
    if (!pastedFkListing?.productUrl.startsWith('https://www.flipkart.com/search?q=')) {
      throw new Error(`FAILED: Flipkart should use search URL, got: ${pastedFkListing?.productUrl}`);
    }
    if (!pastedTataListing?.productUrl.startsWith('https://www.tatacliq.com/search/?searchCategory=all&text=')) {
      throw new Error(`FAILED: Tata CLiQ should use search URL, got: ${pastedTataListing?.productUrl}`);
    }
    console.log('>>> TEST 2 PASSED: Pasted Amazon URL preserved for Amazon, while Flipkart & Tata CLiQ received search URLs!\n');

    console.log('====================================================');
    console.log('TEST 3: Real Pasted Flipkart URL');
    console.log('====================================================');
    const pastedFk = 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm12345?pid=ACCG5';
    const fkRes = await makeReq('POST', '/api/products/analyze-url', { url: pastedFk });
    const fkListings = fkRes.data.product?.decision?.evaluatedPlatforms || fkRes.data.product?.platformListings || [];
    console.log('Pasted Flipkart item platforms:');
    fkListings.forEach((l) => console.log(`  - ${l.platform}: ${l.productUrl}`));

    const fkPlatform = fkListings.find((l) => l.platform.toLowerCase().includes('flipkart'));
    const amzPlatform = fkListings.find((l) => l.platform.toLowerCase().includes('amazon'));
    const tataPlatform = fkListings.find((l) => l.platform.toLowerCase().includes('tata'));

    if (fkPlatform?.productUrl !== 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm12345') {
      throw new Error(`FAILED: Flipkart should preserve exact pasted clean URL, got: ${fkPlatform?.productUrl}`);
    }
    if (!amzPlatform?.productUrl.startsWith('https://www.amazon.in/s?k=')) {
      throw new Error(`FAILED: Amazon should use search URL, got: ${amzPlatform?.productUrl}`);
    }
    if (!tataPlatform?.productUrl.startsWith('https://www.tatacliq.com/search/?searchCategory=all&text=')) {
      throw new Error(`FAILED: Tata CLiQ should use search URL, got: ${tataPlatform?.productUrl}`);
    }
    console.log('>>> TEST 3 PASSED: Pasted Flipkart URL preserved for Flipkart, while Amazon & Tata CLiQ received search URLs!\n');

    console.log('🎉 ALL OUTBOUND LINK GENERATOR TESTS PASSED 100%!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runOutboundTests();

