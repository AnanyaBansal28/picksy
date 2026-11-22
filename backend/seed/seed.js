const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const User = require('../models/User');
const { sampleProducts } = require('./seedData');

dotenv.config();

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/picksy';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`Connected to MongoDB for seeding: ${uri}`);

    // Clear existing collections
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing products and users...');

    // Insert Products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Successfully seeded ${createdProducts.length} realistic Indian E-Commerce and Quick-Commerce products.`);

    // Insert Default Demo User
    const demoUser = await User.create({
      name: 'Aarav Sharma',
      email: 'aarav@picksy.io',
      password: 'password123',
      role: 'user',
      wishlist: [createdProducts[0]._id, createdProducts[2]._id],
    });
    console.log(`✅ Seeded demo user: ${demoUser.email} (Password: password123)`);

    console.log('Seeding complete! You can now start the server.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding encountered an error:', error.message);
    console.log('Note: If local MongoDB is offline, Picksy will automatically run with the built-in In-Memory seed store when you start the server.');
    process.exit(0);
  }
};

seedDB();

