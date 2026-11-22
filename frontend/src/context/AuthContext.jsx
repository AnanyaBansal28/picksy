import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, wishlistService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('picksy_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('picksy_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const savedUser = localStorage.getItem('picksy_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.wishlist || [];
      }
    } catch {}
    return [];
  });

  // Verify and sync user profile on session restore
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data?.success) {
            setUser(res.data.user);
            setWishlistIds(res.data.user.wishlist || []);
            localStorage.setItem('picksy_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // If token expired or invalid (401), clean up
          if (err.response?.status === 401) {
            console.warn('Session expired or invalid token:', err.response?.data?.message);
            logout();
          }
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      if (res.data?.success) {
        const { token: authToken, user: authUser } = res.data;
        localStorage.setItem('picksy_token', authToken);
        localStorage.setItem('picksy_user', JSON.stringify(authUser));
        setToken(authToken);
        setUser(authUser);
        setWishlistIds(authUser.wishlist || []);
        return res.data;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await authService.register({ name, email, password });
      if (res.data?.success) {
        const { token: authToken, user: authUser } = res.data;
        localStorage.setItem('picksy_token', authToken);
        localStorage.setItem('picksy_user', JSON.stringify(authUser));
        setToken(authToken);
        setUser(authUser);
        setWishlistIds(authUser.wishlist || []);
        return res.data;
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const quickDemoLogin = async () => {
    return login('aarav@picksy.io', 'picksy123');
  };

  const logout = () => {
    localStorage.removeItem('picksy_token');
    localStorage.removeItem('picksy_user');
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
        const updated = wishlistIds.filter((id) => (id._id || id) !== productId);
        setWishlistIds(updated);
        if (user) {
          const updatedUser = { ...user, wishlist: updated };
          setUser(updatedUser);
          localStorage.setItem('picksy_user', JSON.stringify(updatedUser));
        }
        return { isSaved: false };
      } else {
        await wishlistService.add(productId);
        const updated = [...wishlistIds, productId];
        setWishlistIds(updated);
        if (user) {
          const updatedUser = { ...user, wishlist: updated };
          setUser(updatedUser);
          localStorage.setItem('picksy_user', JSON.stringify(updatedUser));
        }
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
        quickDemoLogin,
        logout,
        toggleWishlist,
        isProductInWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
