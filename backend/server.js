const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const alertRoutes = require('./routes/alertRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Connect to MongoDB Atlas before handling API requests (reuses cached connection)
app.use(async (req, res, next) => {
  if (req.path && req.path.startsWith('/api')) {
    try {
      await connectDB();
    } catch (err) {
      // Fallback handled in connectDB
    }
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  const isMongoLive = require('./config/db').getIsConnected();
  res.json({
    status: 'online',
    app: 'Picksy API',
    tagline: 'Pick Smartly, Shop Wisely.',
    database: isMongoLive ? 'MongoDB Atlas (Connected)' : 'JSON / In-Memory Fallback Mode',
    mongoReadyState: require('mongoose').connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/alerts', alertRoutes);

// In production or when serving static build
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Fallback to React frontend index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only call app.listen when not in Vercel Serverless environment and run directly
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!isVercel && require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ==============================================================
  💎 PICKSY — "Pick Smartly, Shop Wisely."
  🚀 Server running on http://localhost:${PORT}
  📡 Health check: http://localhost:${PORT}/api/health
  ==============================================================
    `);
    // Connect DB after server starts listening
    connectDB().catch((err) => console.warn('DB note:', err.message));
  });
} else {
  // Connect DB on serverless invocation / module import
  connectDB().catch((err) => console.warn('DB note:', err.message));
}

module.exports = app;
