const mongoose = require('mongoose');

// Cache Mongoose connection globally so Vercel serverless function invocations reuse it
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB Atlas using Mongoose with global connection caching for serverless environments
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.warn('[Picksy DB] MONGODB_URI not provided. Running in JSON/In-Memory Fallback Mode.');
    return null;
  }

  // If already connected, reuse active connection immediately
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then(async (mongooseInstance) => {
        console.log('Connected to MongoDB Atlas');
        cached.conn = mongooseInstance.connection || mongoose.connection;

        // Auto-seed initial catalog into MongoDB Atlas if collection is empty
        try {
          const Product = mongoose.models.Product || require('../models/Product');
          const count = await Product.countDocuments();
          if (count === 0) {
            const { sampleProducts } = require('../seed/seedData');
            if (sampleProducts && sampleProducts.length > 0) {
              await Product.insertMany(sampleProducts);
              console.log(`[Picksy DB] Initialized MongoDB Atlas with ${sampleProducts.length} default catalog products.`);
            }
          }
        } catch (seedErr) {
          // Non-fatal if auto-seed fails
        }

        return cached.conn;
      })
      .catch((err) => {
        cached.promise = null;
        console.warn(
          `[Picksy DB] MongoDB Atlas connection failed (${err.message || 'connection error'}). Using JSON/In-Memory Fallback Mode.`
        );
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    return null;
  }

  return cached.conn;
};

mongoose.connection.on('disconnected', () => {
  if (cached) cached.conn = null;
  console.warn('[Picksy DB] MongoDB Atlas disconnected. Falling back to In-Memory Mode.');
});

mongoose.connection.on('error', (err) => {
  console.warn(`[Picksy DB] MongoDB Atlas error: ${err.message}`);
});

/**
 * Returns true if real MongoDB Atlas is actively connected (readyState === 1)
 */
const getIsConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  getIsConnected,
};
