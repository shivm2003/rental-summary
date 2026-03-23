// src/contexts/CartContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { 
                ...item, 
                quantity: (item.quantity || 1) + (product.quantity || 1),
                rentalDays: product.rentalDays || item.rentalDays || 1
              }
            : item
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1, rentalDays: product.rentalDays || 1 }];
    });
    
    toast.success('Product Added', { duration: 1000 });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    toast.success('Removed from cart');
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return;
    setCart(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const updateRentalDays = useCallback((productId, rentalDays) => {
    if (rentalDays < 1) return;
    setCart(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, rentalDays } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    toast.success('Cart cleared');
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const price = item.rental_price_per_day || item.price || 0;
      const days = item.rentalDays || 1;
      const qty = item.quantity || 1;
      return total + (price * days * qty);
    }, 0);
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + (item.quantity || 1), 0);
  }, [cart]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateRentalDays,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart: (id) => cart.some(item => item.id === id)
  }), [cart, addToCart, removeFromCart, updateQuantity, updateRentalDays, clearCart, getCartTotal, getCartCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};