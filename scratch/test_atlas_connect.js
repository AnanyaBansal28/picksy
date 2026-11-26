const mongoose = require('../backend/node_modules/mongoose');

const uri = 'mongodb+srv://ananya0259becse24_db_user:XLZAO197JuJm39nb@cluster0.pwdvcxl.mongodb.net/picksy?retryWrites=true&w=majority';

async function testConnection() {
  console.log('Testing connection to MongoDB Atlas...');
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Connection readyState:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db?.databaseName);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Existing collections:', collections.map((c) => c.name));

    await mongoose.disconnect();
    console.log('Disconnected cleanly.');
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    if (err.name) console.error('Error name:', err.name);
    process.exit(1);
  }
}

testConnection();
