const mongoose = require('mongoose');

const HistoricalPriceSchema = new mongoose.Schema({
  date: {
    type: String, // 'YYYY-MM-DD' format for crisp charting
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    default: 'Standard Price',
  },
});

const CouponDetailsSchema = new mongoose.Schema({
  code: { type: String, default: '' },
  discountAmount: { type: Number, default: 0 },
  minSpend: { type: Number, default: 0 },
  terms: { type: String, default: '' },
  isFakeDiscount: { type: Boolean, default: false },
  fakeDiscountReason: { type: String, default: '' },
});

const PlatformListingSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['Amazon', 'Flipkart', 'Myntra', 'Blinkit', 'Zepto', 'Instamart', 'Tata CliQ', 'Nykaa'],
  },
  basePrice: {
    type: Number,
    required: true,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  freeDeliveryThreshold: {
    type: Number,
    default: 499,
  },
  handlingFee: {
    type: Number,
    default: 0, // Quick-commerce handling / packaging charges
  },
  sellerRating: {
    type: Number,
    default: 4.5,
    min: 1,
    max: 5,
  },
  sellerName: {
    type: String,
    default: 'Authorized Retailer',
  },
  returnPolicy: {
    type: String,
    default: '7 Days Replacement',
  },
  returnPolicyScore: {
    type: Number,
    default: 8, // 1 - 10 scale
    min: 1,
    max: 10,
  },
  eta: {
    type: String,
    default: '1-2 Days',
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  couponDetails: {
    type: CouponDetailsSchema,
    default: () => ({}),
  },
  productUrl: {
    type: String,
    default: '#',
  },
});

const ReviewIntelligenceSchema = new mongoose.Schema({
  verifiedBuyerConsensus: {
    type: String,
    default: 'Generally positive reception with solid build quality.',
  },
  authenticityScore: {
    type: Number,
    default: 88, // 0 - 100 scale
    min: 0,
    max: 100,
  },
  suspiciousReviewFlag: {
    type: String,
    default: '',
  },
  pros: [{ type: String }],
  cons: [{ type: String }],
  bestUseFor: {
    type: String,
    default: 'Everyday use and enthusiasts seeking reliable performance.',
  },
});

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['ecommerce', 'quick-commerce'],
    },
    subCategory: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    mrp: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: 'unit', // for groceries: '1 L', '500 g', '1 kg', 'Pack of 6'
    },
    description: {
      type: String,
      default: '',
    },
    tags: [{ type: String }],
    historicalPrices: [HistoricalPriceSchema],
    platformListings: [PlatformListingSchema],
    reviewIntelligence: {
      type: ReviewIntelligenceSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for lowest available price
ProductSchema.virtual('lowestPrice').get(function () {
  if (!this.platformListings || this.platformListings.length === 0) return 0;
  return Math.min(...this.platformListings.filter(l => l.inStock).map(l => l.basePrice + l.deliveryFee));
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema, 'products');

