const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
  path: path.join(__dirname, '../backend/.env'),
});

const app = require('../backend/server');
const http = require('http');

async function testExpressServer() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log('Test Express server listening on port:', port);

  try {
    // 1. Health check
    const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
    const healthData = await healthRes.json();
    console.log('Health check response:', healthData);

    // 2. Test Register endpoint via HTTP
    const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demo Test User',
        email: `demo_${Date.now()}@picksy.io`,
        password: 'Password123!',
      }),
    });
    const regData = await regRes.json();
    console.log('Register HTTP status:', regRes.status, '| Success:', regData.success);
    console.log('Token returned:', !!regData.token);
    console.log('User created:', regData.user);

    // 3. Test Login endpoint via HTTP
    const loginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regData.user.email,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login HTTP status:', loginRes.status, '| Success:', loginData.success);
    console.log('Login Token returned:', !!loginData.token);

    // 4. Test wrong password
    const wrongLoginRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regData.user.email,
        password: 'WrongPassword!',
      }),
    });
    const wrongData = await wrongLoginRes.json();
    console.log('Wrong Password HTTP status:', wrongLoginRes.status, '| Message:', wrongData.message);

    // 5. Test unregistered user
    const notFoundRes = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unregistered_person_999@picksy.io',
        password: 'SomePassword123!',
      }),
    });
    const notFoundData = await notFoundRes.json();
    console.log('Unregistered User HTTP status:', notFoundRes.status, '| Message:', notFoundData.message);

    if (regRes.status === 201 && loginRes.status === 200 && wrongLoginRes.status === 401 && notFoundData.message === 'User not found, please sign up.') {
      console.log('\n🎉 ALL EXPRESS HTTP AUTH ENDPOINTS VERIFIED!');
    } else {
      throw new Error('Endpoint verification failed');
    }
  } finally {
    server.close();
  }
}

testExpressServer().catch((err) => {
  console.error('❌ Express server test failed:', err);
  process.exit(1);
});
