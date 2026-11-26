// Vercel Serverless Function entry point bridging to backend/server.js
const app = require('../backend/server');
const { connectDB } = require('../backend/config/db');

// Connect to MongoDB Atlas globally on cold starts
connectDB().catch((err) => console.warn('[Picksy Serverless] Initial DB note:', err.message));

module.exports = app;
