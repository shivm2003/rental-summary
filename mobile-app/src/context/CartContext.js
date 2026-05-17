import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await AsyncStorage.getItem('cart');
        if (saved) {
          setCart(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load cart from storage', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadCart();
  }, []);

  // Persist to AsyncStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart to storage', e);
      }
    };
    saveCart();
  }, [cart, isLoaded]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => (item.id || item._id) === (product.id || product._id));
      if (existing) {
        return prev.map(item => 
          (item.id || item._id) === (product.id || product._id) 
            ? { 
                ...item, 
                quantity: (item.quantity || 1) + (product.quantity || 1),
                rentalDays: product.rentalDays || item.rentalDays || 1,
                start_date: product.start_date || item.start_date,
                end_date: product.end_date || item.end_date
              }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: product.quantity || 1, 
        rentalDays: product.rentalDays || 1,
        start_date: product.start_date,
        end_date: product.end_date
      }];
    });
    
    Toast.show({ type: 'success', text1: 'Added to Cart', text2: product.item_name || product.name || 'Product added', visibilityTime: 1500 });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => (item.id || item._id) !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return;
    setCart(prev => 
      prev.map(item => 
        (item.id || item._id) === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const updateRentalDays = useCallback((productId, rentalDays) => {
    if (rentalDays < 1) return;
    setCart(prev => 
      prev.map(item => 
        (item.id || item._id) === productId ? { ...item, rentalDays } : item
      )
    );
  }, []);

  const updateRentalDates = useCallback((productId, startDate, endDate) => {
    setCart(prev => 
      prev.map(item => {
        if ((item.id || item._id) === productId) {
          let days = item.rentalDays || 1;
          if (startDate && endDate) {
            const msDiff = new Date(endDate) - new Date(startDate);
            days = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)) + 1);
          }
          return { ...item, start_date: startDate, end_date: endDate, rentalDays: days };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const price = item.rental_price_per_day || item.price || 0;
      const days = item.rentalDays || 1;
      const qty = item.quantity || 1;
      const unitMultiplier = (item.price_unit === 'month') ? (days / 30) : days;
      return total + (price * unitMultiplier * qty);
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
    updateRentalDates,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart: (id) => cart.some(item => (item.id || item._id) === id)
  }), [cart, addToCart, removeFromCart, updateQuantity, updateRentalDays, updateRentalDates, clearCart, getCartTotal, getCartCount]);

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
