const mongoose = require('mongoose');

const PriceAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    currentPriceAtCreation: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'triggered', 'dismissed'],
      default: 'active',
    },
    notifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PriceAlert', PriceAlertSchema);

