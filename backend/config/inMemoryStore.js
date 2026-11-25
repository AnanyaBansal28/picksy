const fs = require('fs');
const path = require('path');
const os = require('os');
const { sampleProducts } = require('../seed/seedData');
const bcrypt = require('bcryptjs');

// Local db.json storage path: writes to /tmp/db.json on Vercel (since Vercel's main filesystem is read-only)
const DB_STORAGE_PATH = process.env.VERCEL
  ? '/tmp/db.json'
  : path.join(__dirname, '../data/db.json');

/**
 * Persist current store state to db.json fallback (using /tmp/db.json on Vercel)
 */
function saveDbFallback(data) {
  try {
    const targetPath = DB_STORAGE_PATH;
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (mkdirErr) {
        // Fallback for Windows test environments where C:\tmp doesn't exist
        if (process.platform === 'win32') {
          const winPath = path.join(os.tmpdir(), 'db.json');
          const payload = data || {
            products: memoryProducts,
            users: memoryUsers,
            alerts: memoryAlerts,
            savedAt: new Date().toISOString(),
          };
          fs.writeFileSync(winPath, JSON.stringify(payload, null, 2), 'utf-8');
          return true;
        }
        throw mkdirErr;
      }
    }
    const payload = data || {
      products: memoryProducts,
      users: memoryUsers,
      alerts: memoryAlerts,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('[Picksy Storage] Note: db.json fallback write bypassed:', err.message);
    return false;
  }
}

/**
 * Load state from db.json if available
 */
function loadDbFallback() {
  try {
    const targetPath = DB_STORAGE_PATH;
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      return JSON.parse(raw);
    }
    if (process.platform === 'win32') {
      const winPath = path.join(os.tmpdir(), 'db.json');
      if (fs.existsSync(winPath)) {
        const raw = fs.readFileSync(winPath, 'utf-8');
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn('[Picksy Storage] Note: db.json fallback read bypassed:', err.message);
  }
  return null;
}

function matchesSearch(product, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) return true;

  const query = searchQuery.trim().toLowerCase();
  const queryWords = query.split(/\s+/).filter(Boolean);

  const title = (product.title || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const subCategory = (product.subCategory || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const tags = (product.tags || []).map((t) => t.toLowerCase());

  // Strict disambiguation: "phone" vs "headphones"
  const isQueryOnlyPhone = queryWords.some((w) => w === 'phone' || w === 'phones' || w === 'iphone' || w === 'smartphone');
  const queryHasAudio = queryWords.some((w) =>
    w.includes('head') || w.includes('ear') || w.includes('audio') || w.includes('sound') || w.includes('music')
  );

  if (isQueryOnlyPhone && !queryHasAudio) {
    if (
      subCategory.includes('audio') ||
      subCategory.includes('wearables') ||
      title.includes('headphone') ||
      title.includes('earphone') ||
      title.includes('airpods')
    ) {
      const hasPhoneWord = /\bphone(s)?\b/i.test(title) || /\biphone\b/i.test(title) || /\bsmartphone\b/i.test(title);
      if (!hasPhoneWord) {
        return false;
      }
    }
  }

  return queryWords.every((word) => {
    if (word === 'phone' || word === 'phones') {
      return (
        /\bphone(s)?\b/i.test(title) ||
        /\biphone\b/i.test(title) ||
        /\bsmartphone(s)?\b/i.test(title) ||
        subCategory.includes('smartphones') ||
        tags.some((t) => t === 'phone' || t === 'smartphone' || t === 'iphone' || t === 'mobile')
      );
    }

    return (
      title.includes(word) ||
      brand.includes(word) ||
      subCategory.includes(word) ||
      category.includes(word) ||
      tags.some((t) => t.includes(word))
    );
  });
}

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
    password: bcrypt.hashSync('picksy123', 10),
    role: 'user',
    wishlist: ['prod_101', 'prod_104'],
    totalSavings: 420,
    resetOtp: null,
    resetOtpExpiry: null,
    createdAt: new Date().toISOString(),
  },
];

let memoryAlerts = [
  {
    _id: 'alert_1',
    id: 'alert_1',
    userId: 'user_default_1',
    productId: 'prod_104', // Sony XM5
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
        results = results.filter((p) => matchesSearch(p, query.search));
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
      saveDbFallback();
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
      saveDbFallback();
      return items;
    },
  },

  users: {
    findOne: async (query) => {
      if (query.email) {
        const target = query.email.trim().toLowerCase();
        return memoryUsers.find((u) => u.email.toLowerCase() === target) || null;
      }
      if (query._id) {
        return memoryUsers.find((u) => u._id === query._id || u.id === query._id) || null;
      }
      return null;
    },
    findById: async (id) => {
      const u = memoryUsers.find((user) => user._id === id || user.id === id);
      if (!u) return null;
      return {
        ...u,
        select: (fields) => {
          if (fields && fields.includes('-password')) {
            const { password, ...rest } = u;
            return rest;
          }
          return u;
        },
      };
    },
    create: async ({ name, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newId = `user_${Date.now()}`;
      const newUser = {
        _id: newId,
        id: newId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
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
    updateOtp: async (email, otp, expiry) => {
      const user = memoryUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (user) {
        user.resetOtp = otp;
        user.resetOtpExpiry = expiry;
      }
      return user;
    },
    updatePassword: async (email, hashedPassword) => {
      const user = memoryUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (user) {
        user.password = hashedPassword;
        user.resetOtp = null;
        user.resetOtpExpiry = null;
      }
      return user;
    },
    addSavings: async (userId, amount) => {
      const user = memoryUsers.find((u) => u._id === userId || u.id === userId) || memoryUsers[0];
      if (user) {
        user.totalSavings = (user.totalSavings || 0) + amount;
        return user.totalSavings;
      }
      return amount;
    },
  },

  alerts: {
    find: async (query) => {
      if (query.userId) {
        const userAlerts = memoryAlerts.filter((a) => a.userId === query.userId);
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
      saveDbFallback();
      return newAlert;
    },
    delete: async (alertId, userId) => {
      const initialLen = memoryAlerts.length;
      memoryAlerts = memoryAlerts.filter((a) => !(a._id === alertId && a.userId === userId));
      saveDbFallback();
      return memoryAlerts.length < initialLen;
    },
  },
  DB_STORAGE_PATH,
  saveDbFallback,
  loadDbFallback,
};

module.exports = inMemoryStore;
