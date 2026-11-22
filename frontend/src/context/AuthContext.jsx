import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, wishlistService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('picksy_token') || null);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            setWishlistIds(res.data.user.wishlist || []);
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data.success) {
      localStorage.setItem('picksy_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setWishlistIds(res.data.user.wishlist || []);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    if (res.data.success) {
      localStorage.setItem('picksy_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setWishlistIds([]);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const quickDemoLogin = async () => {
    return login('aarav@picksy.io', 'picksy123');
  };

  const logout = () => {
    localStorage.removeItem('picksy_token');
    setToken(null);
    setUser(null);
    setWishlistIds([]);
  };

  const toggleWishlist = async (productId) => {
    if (!token) {
      return { requiresAuth: true };
    }
    const isSaved = wishlistIds.some((id) => (id._id || id) === productId);
    try {
      if (isSaved) {
        await wishlistService.remove(productId);
        setWishlistIds((prev) => prev.filter((id) => (id._id || id) !== productId));
        return { isSaved: false };
      } else {
        await wishlistService.add(productId);
        setWishlistIds((prev) => [...prev, productId]);
        return { isSaved: true };
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      return { error: true };
    }
  };

  const isProductInWishlist = (productId) => {
    return wishlistIds.some((id) => (id._id || id) === productId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        wishlistIds,
        login,
        register,
        logout,
        quickDemoLogin,
        toggleWishlist,
        isProductInWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

