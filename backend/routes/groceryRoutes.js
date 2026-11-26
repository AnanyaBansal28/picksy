const express = require('express');
const router = express.Router();
const { analyzeGroceryItem } = require('../controllers/groceryController');

// @route   POST /api/grocery/analyze-item
// @desc    Analyze grocery link or item query for 10-min store comparison
// @access  Public
router.post('/analyze-item', analyzeGroceryItem);

module.exports = router;
