const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/picksy';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 800,
    });
    isConnected = true;
    console.log(`[Picksy DB] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Picksy DB] Local MongoDB offline. Using In-Memory Mode.`);
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = {
  connectDB,
  getIsConnected,
};
