import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // cartItems: Array of { product, platform: 'Blinkit'|'Zepto'|'Instamart', quantity: number, unitPrice: number }
  const [cartItems, setCartItems] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  // Trigger backend optimization whenever cartItems change
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
          platform: item.platform,
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

    const timer = setTimeout(runOptimizer, 150);
    return () => clearTimeout(timer);
  }, [cartItems]);

  // Add item specifically to a platform
  const addToPlatform = (product, platform, quantity = 1) => {
    const pId = (product._id || product.id).toString();
    const listing = product.platformListings?.find((l) => l.platform === platform);
    const unitPrice = listing?.basePrice || product.mrp;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => (item.product._id || item.product.id).toString() === pId && item.platform === platform
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { product, platform, quantity, unitPrice }];
    });
  };

  // Update quantity on specific platform
  const updatePlatformQuantity = (productId, platform, newQuantity) => {
    const pId = productId.toString();
    if (newQuantity <= 0) {
      removeFromPlatform(pId, platform);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        (item.product._id || item.product.id).toString() === pId && item.platform === platform
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove item from specific platform
  const removeFromPlatform = (productId, platform) => {
    const pId = productId.toString();
    setCartItems((prev) =>
      prev.filter(
        (item) => !((item.product._id || item.product.id).toString() === pId && item.platform === platform)
      )
    );
  };

  // Get quantity of product on a specific platform
  const getPlatformQuantity = (productId, platform) => {
    const pId = productId.toString();
    const found = cartItems.find(
      (item) => (item.product._id || item.product.id).toString() === pId && item.platform === platform
    );
    return found ? found.quantity : 0;
  };

  // Get total quantity of product across all platforms
  const getItemTotalQuantity = (productId) => {
    const pId = productId.toString();
    return cartItems
      .filter((item) => (item.product._id || item.product.id).toString() === pId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Auto-optimize: switch any sub-optimal items to their cheapest platform
  const autoOptimizeCart = () => {
    const platforms = ['Blinkit', 'Zepto', 'Instamart'];

    setCartItems((prev) => {
      const productMap = {};

      // Consolidate quantities per product
      for (const item of prev) {
        const pId = (item.product._id || item.product.id).toString();
        if (!productMap[pId]) {
          productMap[pId] = {
            product: item.product,
            quantity: 0,
          };
        }
        productMap[pId].quantity += item.quantity;
      }

      // Reallocate to cheapest platform
      const optimizedItems = [];
      for (const pId in productMap) {
        const { product, quantity } = productMap[pId];
        let cheapestListing = null;
        let minPrice = Infinity;

        for (const l of product.platformListings || []) {
          if (platforms.includes(l.platform) && l.inStock) {
            if (l.basePrice < minPrice) {
              minPrice = l.basePrice;
              cheapestListing = l;
            }
          }
        }

        const chosenPlatform = cheapestListing ? cheapestListing.platform : 'Blinkit';
        optimizedItems.push({
          product,
          platform: chosenPlatform,
          quantity,
          unitPrice: minPrice !== Infinity ? minPrice : product.mrp,
        });
      }

      return optimizedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setOptimization(null);
  };

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItemCount,
        optimization,
        optimizing,
        addToPlatform,
        updatePlatformQuantity,
        removeFromPlatform,
        getPlatformQuantity,
        getItemTotalQuantity,
        autoOptimizeCart,
        clearCart,
        setCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
