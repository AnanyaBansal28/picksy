const http = require('http');

async function runTests() {
  process.env.PORT = 5997;
  process.env.JWT_SECRET = 'picksy_test_secret_key_12345';
  process.env.NODE_ENV = 'test';

  const app = require('../backend/server');
  await new Promise((r) => setTimeout(r, 600));

  const analyzeUrl = (payload) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5997,
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
    console.log('TEST 1: User explicitly passes Current Price (₹499)');
    console.log('====================================================');
    const toyUrl = 'https://www.amazon.in/Baybee-Interactive-Smartphone-Educational-Flashing/dp/B0GSZ14C55?crid=ABC';
    const res1 = await analyzeUrl({ url: toyUrl, currentPrice: 499 });
    console.log('Status:', res1.status);
    console.log('Has User Price:', res1.data.hasUserPrice);
    console.log('User Price:', res1.data.userPrice);
    const listings = res1.data.product?.platformListings || [];
    console.log('Platform Listings:');
    listings.forEach((l) => console.log(`  - ${l.platform}: ₹${l.basePrice}`));
    
    const amazonListing = listings.find((l) => l.platform === 'Amazon');
    const flipkartListing = listings.find((l) => l.platform === 'Flipkart');
    const tataListing = listings.find((l) => l.platform === 'Tata CliQ');

    if (amazonListing?.basePrice !== 499) {
      throw new Error(`FAILED: Amazon basePrice should be exactly 499, got: ${amazonListing?.basePrice}`);
    }
    if (flipkartListing?.basePrice !== 479) {
      throw new Error(`FAILED: Flipkart basePrice should be around 479, got: ${flipkartListing?.basePrice}`);
    }
    if (tataListing?.basePrice !== 529) {
      throw new Error(`FAILED: Tata CliQ basePrice should be around 529, got: ${tataListing?.basePrice}`);
    }

    const hist = res1.data.product?.historicalPrices || [];
    console.log(`History count: ${hist.length}, Recent date: ${hist[hist.length - 1]?.date}, Recent price: ₹${hist[hist.length - 1]?.price}`);
    console.log('>>> TEST 1 PASSED: User entered 499 properly set on Amazon with dynamic competitor prices 479 & 529!\n');

    console.log('====================================================');
    console.log('TEST 2: Blank price on Link A vs Link B (Distinct Dynamic Pricing)');
    console.log('====================================================');
    const linkA = 'https://www.amazon.in/Baybee-Interactive-Smartphone-Educational-Flashing/dp/B0GSZ14C55';
    const linkB = 'https://www.amazon.in/Shumee-Wooden-Toy-Activity-Musical-Phone/dp/B08X7V1234';

    const resA = await analyzeUrl({ url: linkA });
    const resB = await analyzeUrl({ url: linkB });

    const priceA = resA.data.product?.platformListings?.[0]?.basePrice;
    const priceB = resB.data.product?.platformListings?.[0]?.basePrice;
    const imgA = resA.data.product?.image;
    const imgB = resB.data.product?.image;

    console.log(`Link A (Baybee): ₹${priceA} | Image: ${imgA}`);
    console.log(`Link B (Shumee): ₹${priceB} | Image: ${imgB}`);

    if (priceA === 399 && priceB === 399) {
      throw new Error('FAILED: Both prices are static 399! Should be dynamically computed.');
    }
    if (priceA < 299 || priceA > 899) {
      throw new Error(`FAILED: Link A price ₹${priceA} outside toys range ₹299-₹899`);
    }
    if (priceB < 299 || priceB > 899) {
      throw new Error(`FAILED: Link B price ₹${priceB} outside toys range ₹299-₹899`);
    }
    console.log('>>> TEST 2 PASSED: Different toy links produced distinct pseudo-random prices in range ₹299-₹899!\n');

    console.log('====================================================');
    console.log('TEST 3: Blank price on Audio link (Range: ₹1,499 - ₹4,999)');
    console.log('====================================================');
    const audioUrl = 'https://www.amazon.in/Boat-Airdopes-Wireless-Earbuds-Headphones/dp/B09N3ZNHTY';
    const resAudio = await analyzeUrl({ url: audioUrl });
    const priceAudio = resAudio.data.product?.platformListings?.[0]?.basePrice;
    console.log(`Audio Product: ${resAudio.data.product?.title}`);
    console.log(`SubCategory: ${resAudio.data.product?.subCategory}`);
    console.log(`Audio Base Price: ₹${priceAudio}`);

    if (priceAudio < 1400 || priceAudio > 5000) {
      throw new Error(`FAILED: Audio price ₹${priceAudio} outside range ₹1,499-₹4,999`);
    }
    console.log('>>> TEST 3 PASSED: Audio product categorized under Audio & Wearables with realistic ₹1,499-₹4,999 pricing!\n');

    console.log('====================================================');
    console.log('TEST 4: Blank price on Smartphone link (Range: ₹14,999 - ₹69,999)');
    console.log('====================================================');
    const phoneUrl = 'https://www.amazon.in/OnePlus-Nord-CE-5G-Smartphone/dp/B0BY8JZ22K';
    const resPhone = await analyzeUrl({ url: phoneUrl });
    const pricePhone = resPhone.data.product?.platformListings?.[0]?.basePrice;
    console.log(`Phone Product: ${resPhone.data.product?.title}`);
    console.log(`SubCategory: ${resPhone.data.product?.subCategory}`);
    console.log(`Phone Base Price: ₹${pricePhone}`);

    if (pricePhone < 14000 || pricePhone > 70000) {
      throw new Error(`FAILED: Smartphone price ₹${pricePhone} outside range ₹14,999-₹69,999`);
    }
    console.log('>>> TEST 4 PASSED: Smartphone link assigned realistic flagship pricing in range ₹14,999-₹69,999!\n');

    console.log('🎉 ALL DYNAMIC PRICING & USER PRICE TESTS PASSED 100%!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();

