import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  // Trigger optimization whenever cartItems change
  useEffect(() => {
    if (cartItems.length === 0) {
      setOptimization(null);
      return;
    }

    const runOptimizer = async () => {
      setOptimizing(true);
      try {
        const payload = cartItems.map((item) => ({
          productId: item.product._id || item.product.id,
          quantity: item.quantity,
        }));
        const res = await cartService.optimize(payload);
        if (res.data.success) {
          setOptimization(res.data);
        }
      } catch (err) {
        console.error('Cart optimization error:', err);
      } finally {
        setOptimizing(false);
      }
    };

    const timer = setTimeout(runOptimizer, 250);
    return () => clearTimeout(timer);
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const pId = product._id || product.id;
      const existing = prev.find((item) => (item.product._id || item.product.id) === pId);
      if (existing) {
        return prev.map((item) =>
          (item.product._id || item.product.id) === pId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        (item.product._id || item.product.id) === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) =>
      prev.filter((item) => (item.product._id || item.product.id) !== productId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setOptimization(null);
  };

  const getItemQuantity = (productId) => {
    const item = cartItems.find((i) => (i.product._id || i.product.id) === productId);
    return item ? item.quantity : 0;
  };

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemCount,
        optimization,
        optimizing,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        setCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
