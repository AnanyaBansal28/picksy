const express = require('express');
const router = express.Router();
const { optimizeCart } = require('../controllers/cartController');

router.post('/optimize', optimizeCart);

module.exports = router;

