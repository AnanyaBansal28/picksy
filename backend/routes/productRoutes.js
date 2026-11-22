const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getSpotlightDeals } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/spotlight/deals', getSpotlightDeals);
router.get('/:id', getProductById);

module.exports = router;

