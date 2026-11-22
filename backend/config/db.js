const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Support both MONGO_URI and MONGODB_URI environment variable names with local fallback
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/picksy';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
    });
    isConnected = true;
    console.log(`[Picksy DB] MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(
      `[Picksy DB] Local MongoDB offline (${error.message || 'connection failed'}). Using In-Memory Fallback Mode.`
    );
    isConnected = false;
    return false;
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Picksy DB] MongoDB disconnected. Falling back to In-Memory Mode.');
});

mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[Picksy DB] MongoDB connected.');
});

const getIsConnected = () => isConnected;

module.exports = {
  connectDB,
  getIsConnected,
};
