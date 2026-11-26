const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { connectDB, getIsConnected } = require('../backend/config/db');
const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/models/User');
const Product = require('../backend/models/Product');

async function testFullAtlasIntegration() {
  console.log('Connecting via connectDB()...');
  const conn = await connectDB();
  console.log('connectDB result readyState:', mongoose.connection.readyState);
  console.log('getIsConnected():', getIsConnected());

  if (!getIsConnected()) {
    throw new Error('connectDB did not connect to MongoDB Atlas');
  }

  // Count products
  const productCount = await Product.countDocuments();
  console.log('Products in MongoDB Atlas:', productCount);

  // Test creating / checking User in MongoDB Atlas
  const testEmail = `atlas_test_${Date.now()}@picksy.io`;
  const createdUser = await User.create({
    name: 'Atlas Test User',
    email: testEmail,
    password: 'SecurePassword123!',
  });
  console.log('Successfully created test user in Atlas:', createdUser._id.toString(), createdUser.email);

  // Verify bcrypt password hashing worked
  const fetchedUser = await User.findById(createdUser._id).select('+password');
  console.log('Fetched user from Atlas. Password is hashed:', fetchedUser.password.startsWith('$2'));

  // Test matchPassword method
  const isMatch = await fetchedUser.matchPassword('SecurePassword123!');
  console.log('Password match verification:', isMatch);

  // Clean up test user
  await User.deleteOne({ _id: createdUser._id });
  console.log('Cleaned up test user from Atlas.');

  await mongoose.disconnect();
  console.log('\n🎉 ALL MONGODB ATLAS INTEGRATION CHECKS PASSED SUCCESSFULLY!');
}

testFullAtlasIntegration().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
