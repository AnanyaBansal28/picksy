const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getSpotlightDeals,
  analyzeUrl,
  searchLiveProducts,
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/spotlight/deals', getSpotlightDeals);
router.get('/live-search', searchLiveProducts);
router.post('/analyze-url', analyzeUrl);
router.get('/:id', getProductById);

module.exports = router;
