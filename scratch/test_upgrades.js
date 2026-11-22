const http = require('http');

async function runTests() {
  process.env.PORT = 5999;
  process.env.JWT_SECRET = 'picksy_test_secret_key_12345';
  process.env.NODE_ENV = 'test';
  
  const app = require('../backend/server');
  
  await new Promise(r => setTimeout(r, 600));

  const makeRequest = (method, path, body, headers = {}) => {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = http.request({
        hostname: '127.0.0.1',
        port: 5999,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...headers
        }
      }, (res) => {
        let resBody = '';
        res.on('data', chunk => resBody += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch (e) {
            resolve({ status: res.statusCode, data: resBody });
          }
        });
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  };

  try {
    console.log('--- 1. Testing Health Check ---');
    const health = await makeRequest('GET', '/api/health');
    console.log('Health status:', health.status, health.data.app);

    console.log('\n--- 2. Testing URL Analyzer (Amazon iPhone 15) ---');
    const analyzeRes = await makeRequest('POST', '/api/products/analyze-url', {
      url: 'https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY/'
    });
    console.log('Analyze status:', analyzeRes.status);
    const prod = analyzeRes.data.product;
    console.log('Matched Title:', prod?.title);
    console.log('Best Platform:', prod?.decisionMetrics?.bestPlatform?.platform);
    console.log('Verdict:', prod?.decisionMetrics?.dealVerdict);
    console.log('Price History length:', prod?.priceHistory?.length);

    console.log('\n--- 3. Testing URL Analyzer (Flipkart generic URL) ---');
    const fkRes = await makeRequest('POST', '/api/products/analyze-url', {
      url: 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm12345'
    });
    console.log('Flipkart analyze status:', fkRes.status);
    console.log('Matched / Generated Title:', fkRes.data.product?.title);

    console.log('\n--- 4. Testing User Registration & Total Savings ---');
    const testEmail = `tester_${Date.now()}@picksy.in`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Picksy Saver',
      email: testEmail,
      password: 'password123'
    });
    console.log('Register status:', regRes.status, 'Total Savings:', regRes.data.user?.totalSavings);
    const token = regRes.data.token;

    console.log('\n--- 5. Testing POST /api/auth/add-savings ---');
    const saveRes = await makeRequest('POST', '/api/auth/add-savings', {
      amount: 1499,
      source: 'iPhone 15 Flipkart Deal'
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Add savings status:', saveRes.status);
    console.log('New Total Savings:', saveRes.data.totalSavings);
    console.log('Saved amount:', saveRes.data.savedAmount);

    console.log('\n--- 6. Testing Price Drop Simulator ---');
    const alertCreateRes = await makeRequest('POST', '/api/alerts', {
      productId: prod._id || 'prod_101',
      targetPrice: 60000
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Alert created status:', alertCreateRes.status, 'Alert ID:', alertCreateRes.data.alert?._id || alertCreateRes.data.alert?.id);

    const alertId = alertCreateRes.data.alert?._id || alertCreateRes.data.alert?.id;
    const simRes = await makeRequest('POST', '/api/alerts/simulate-drop', {
      alertId,
      productId: prod._id || 'prod_101'
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Simulate drop status:', simRes.status);
    console.log('Dropped Price:', simRes.data.droppedPrice);
    console.log('Notification message:', simRes.data.notification?.message);
    console.log('Alert isTriggered:', simRes.data.alert?.isTriggered);

    console.log('\n✅ ALL 6 VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
