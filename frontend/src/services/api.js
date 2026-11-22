import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('picksy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth expiration handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('picksy_token')) {
        console.warn('Session expired. Logging out.');
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  addSavings: (data) => api.post('/auth/add-savings', data),
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getSpotlightDeals: () => api.get('/products/spotlight/deals'),
  analyzeUrl: (data) => api.post('/products/analyze-url', data),
  liveSearch: (query) => api.get('/products/live-search', { params: { q: query } }),
};

export const cartService = {
  optimize: (items) => api.post('/cart/optimize', { items }),
};

export const wishlistService = {
  getAll: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const alertService = {
  getAll: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  simulateDrop: (data) => api.post('/alerts/simulate-drop', data),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export default api;
