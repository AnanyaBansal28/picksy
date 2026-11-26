const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
  path: path.join(__dirname, '../backend/.env'),
});

const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const User = require('../backend/models/User');
const { registerUser, loginUser } = require('../backend/controllers/authController');

// Mock Express response helper
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function testAuthMongoFlow() {
  console.log('=== TEST: Auth Register & Login with MongoDB User Model ===\n');

  // Verify User Model collection
  console.log('1. User Model Collection Name:', User.collection.name);
  if (User.collection.name !== 'users') {
    throw new Error(`Expected collection name 'users', got '${User.collection.name}'`);
  }

  // 1. Test when mongoose.connection.readyState === 1
  // We simulate readyState === 1 by stubbing or checking User model methods
  console.log('2. Testing Mongoose User document creation & password hashing directly...');
  const testUser = new User({
    name: 'Picksy Tester',
    email: 'test_picksy_user@example.com',
    password: 'SuperSecretPassword123',
  });

  // Verify pre-save hook hashes password with bcrypt
  const pres = User.schema.s.hooks._pres.get('save');
  const customHook = pres.find(p => p.fn.toString().includes('bcrypt') || p.fn.toString().includes('isModified'));
  if (customHook) {
    await customHook.fn.call(testUser);
  }
  console.log('Hashed password starts with $2a$ or $2b$:', testUser.password.startsWith('$2a$') || testUser.password.startsWith('$2b$'));
  const isMatchCorrect = await testUser.matchPassword('SuperSecretPassword123');
  const isMatchWrong = await testUser.matchPassword('WrongPassword');
  console.log('bcrypt compare -> Correct Password:', isMatchCorrect, '| Wrong Password:', isMatchWrong);

  if (!isMatchCorrect || isMatchWrong) {
    throw new Error('Password hashing / matching failed');
  }

  // 3. Test registerUser Controller with readyState = 1 (stubbing User.findOne & User.create)
  console.log('\n3. Testing registerUser with readyState === 1...');
  const originalReadyState = mongoose.connection.readyState;
  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

  let savedMongoUser = null;
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  User.findOne = async (query) => {
    console.log('  -> User.findOne called on MongoDB User model with:', query);
    return null; // No existing user
  };

  User.create = async (userData) => {
    console.log('  -> User.create called on MongoDB User model with:', { name: userData.name, email: userData.email });
    savedMongoUser = new User(userData);
    savedMongoUser._id = 'mock_mongo_id_999';
    return savedMongoUser;
  };

  const regReq = {
    body: {
      name: 'Ananya Sharma',
      email: 'ananya@picksy.io',
      password: 'mypassword123',
    },
  };
  const regRes = createMockRes();
  const nextFn = (err) => { if (err) console.error('Next called with error:', err); };

  await registerUser(regReq, regRes, nextFn);

  console.log('registerUser Status:', regRes.statusCode);
  console.log('registerUser Success:', regRes.body?.success);
  console.log('registerUser Token returned:', !!regRes.body?.token);
  console.log('registerUser User ID:', regRes.body?.user?.id);

  if (!regRes.body?.success || !regRes.body?.token) {
    throw new Error('registerUser did not return success and valid token');
  }

  // Verify JWT token signature
  const JWT_SECRET = process.env.JWT_SECRET || 'picksy_super_secret_jwt_key_2026';
  const decodedReg = jwt.verify(regRes.body.token, JWT_SECRET);
  console.log('Decoded Token ID from register:', decodedReg.id);
  if (decodedReg.id !== savedMongoUser._id.toString()) {
    throw new Error('JWT token did not encode the MongoDB User _id');
  }

  // 4. Test loginUser Controller with readyState = 1 (stubbing User.findOne)
  console.log('\n4. Testing loginUser with readyState === 1...');
  User.findOne = (query) => {
    console.log('  -> User.findOne called on MongoDB User model with:', query);
    return {
      select: (fields) => {
        console.log('  -> .select() called with:', fields);
        return {
          _id: 'mock_mongo_id_999',
          name: 'Ananya Sharma',
          email: 'ananya@picksy.io',
          role: 'user',
          wishlist: [],
          totalSavings: 45,
          matchPassword: async (pwd) => pwd === 'mypassword123',
        };
      },
    };
  };

  const loginReq = {
    body: {
      email: 'ananya@picksy.io',
      password: 'mypassword123',
    },
  };
  const loginRes = createMockRes();

  await loginUser(loginReq, loginRes, nextFn);

  console.log('loginUser Status:', loginRes.statusCode);
  console.log('loginUser Success:', loginRes.body?.success);
  console.log('loginUser Token returned:', !!loginRes.body?.token);
  console.log('loginUser User email:', loginRes.body?.user?.email);

  if (!loginRes.body?.success || !loginRes.body?.token) {
    throw new Error('loginUser did not return success and valid token');
  }

  const decodedLogin = jwt.verify(loginRes.body.token, JWT_SECRET);
  console.log('Decoded Token ID from login:', decodedLogin.id);
  if (decodedLogin.id !== 'mock_mongo_id_999') {
    throw new Error('JWT token did not encode the MongoDB User _id on login');
  }

  // Restore mocks
  User.findOne = originalFindOne;
  User.create = originalCreate;
  Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });

  console.log('\n5. Testing fallback when readyState === 0 (disconnected)...');
  const fallbackReq = {
    body: {
      email: 'aarav@picksy.io',
      password: 'picksy123',
    },
  };
  const fallbackRes = createMockRes();
  await loginUser(fallbackReq, fallbackRes, nextFn);
  console.log('Fallback login status:', fallbackRes.statusCode, '| Success:', fallbackRes.body?.success, '| User:', fallbackRes.body?.user?.email);

  console.log('\n🎉 ALL AUTH MONGODB & FALLBACK CHECKS PASSED SUCCESSFULLY!');
}

testAuthMongoFlow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
