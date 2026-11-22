const { sampleProducts } = require('../seed/seedData');
const bcrypt = require('bcryptjs');

// In-Memory storage initialized with realistic IDs and seeded products
let memoryProducts = sampleProducts.map((p, idx) => ({
  ...p,
  _id: `prod_${idx + 101}`,
  id: `prod_${idx + 101}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

let memoryUsers = [
  {
    _id: 'user_default_1',
    id: 'user_default_1',
    name: 'Aarav Sharma',
    email: 'aarav@picksy.io',
    // Pre-hashed for 'picksy123'
    password: bcrypt.hashSync('picksy123', 10),
    role: 'user',
    wishlist: ['prod_101', 'prod_103'],
    createdAt: new Date().toISOString(),
  },
];

let memoryAlerts = [
  {
    _id: 'alert_1',
    id: 'alert_1',
    userId: 'user_default_1',
    productId: 'prod_102', // Sony XM5
    targetPrice: 25000,
    currentPriceAtCreation: 29990,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

const inMemoryStore = {
  products: {
    find: async (query = {}) => {
      let results = [...memoryProducts];

      if (query.category) {
        results = results.filter((p) => p.category === query.category);
      }
      if (query.subCategory && query.subCategory !== 'All') {
        results = results.filter((p) => p.subCategory.toLowerCase() === query.subCategory.toLowerCase());
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        results = results.filter(
          (p) =>
            p.title.toLowerCase().includes(s) ||
            p.brand.toLowerCase().includes(s) ||
            (p.tags && p.tags.some((t) => t.toLowerCase().includes(s)))
        );
      }
      return results;
    },
    findById: async (id) => {
      return memoryProducts.find((p) => p._id === id || p.id === id) || null;
    },
    create: async (data) => {
      const newProduct = {
        ...data,
        _id: `prod_${Date.now()}`,
        id: `prod_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      memoryProducts.push(newProduct);
      return newProduct;
    },
    countDocuments: async () => memoryProducts.length,
    insertMany: async (items) => {
      items.forEach((item, idx) => {
        memoryProducts.push({
          ...item,
          _id: `prod_${Date.now()}_${idx}`,
          id: `prod_${Date.now()}_${idx}`,
        });
      });
      return items;
    },
  },

  users: {
    findOne: async (query) => {
      if (query.email) {
        return memoryUsers.find((u) => u.email.toLowerCase() === query.email.toLowerCase()) || null;
      }
      if (query._id) {
        return memoryUsers.find((u) => u._id === query._id) || null;
      }
      return null;
    },
    findById: async (id) => {
      const u = memoryUsers.find((user) => user._id === id || user.id === id);
      if (!u) return null;
      return {
        ...u,
        select: (fields) => {
          if (fields.includes('-password')) {
            const { password, ...rest } = u;
            return rest;
          }
          return u;
        },
      };
    },
    create: async ({ name, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: `user_${Date.now()}`,
        id: `user_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        wishlist: [],
        createdAt: new Date().toISOString(),
      };
      memoryUsers.push(newUser);
      return newUser;
    },
    updateWishlist: async (userId, productId, action) => {
      const user = memoryUsers.find((u) => u._id === userId || u.id === userId);
      if (!user) return null;
      if (action === 'add') {
        if (!user.wishlist.includes(productId)) {
          user.wishlist.push(productId);
        }
      } else if (action === 'remove') {
        user.wishlist = user.wishlist.filter((id) => id !== productId);
      }
      return user.wishlist;
    },
  },

  alerts: {
    find: async (query) => {
      if (query.userId) {
        const userAlerts = memoryAlerts.filter((a) => a.userId === query.userId);
        // Populate product
        return userAlerts.map((a) => {
          const product = memoryProducts.find((p) => p._id === a.productId || p.id === a.productId);
          return {
            ...a,
            productId: product || { _id: a.productId, title: 'Item' },
          };
        });
      }
      return memoryAlerts;
    },
    create: async ({ userId, productId, targetPrice, currentPriceAtCreation }) => {
      const newAlert = {
        _id: `alert_${Date.now()}`,
        id: `alert_${Date.now()}`,
        userId,
        productId,
        targetPrice,
        currentPriceAtCreation,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      memoryAlerts.push(newAlert);
      return newAlert;
    },
    delete: async (alertId, userId) => {
      const initialLen = memoryAlerts.length;
      memoryAlerts = memoryAlerts.filter((a) => !(a._id === alertId && a.userId === userId));
      return memoryAlerts.length < initialLen;
    },
  },
};

module.exports = inMemoryStore;
