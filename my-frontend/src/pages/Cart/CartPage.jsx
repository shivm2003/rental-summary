// src/pages/Cart/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Trash2, Plus, Minus, MapPin, ShieldCheck, 
  Truck, Package, ChevronRight, Percent, 
  Clock, ArrowRight, ShoppingCart
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    updateRentalDays,
    updateRentalDates,
    clearCart,
    getCartTotal 
  } = useCart();

  const [showLoginPrompt, setShowLoginPrompt] = useState(!user);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [savingAmount, setSavingAmount] = useState(0);
  
  // Bookings state for restricting dates in cart
  const [productBookings, setProductBookings] = useState({});

  useEffect(() => {
    const fetchBookings = async () => {
      const bookingsMap = { ...productBookings };
      let updated = false;
      for (const item of cart) {
         if (!bookingsMap[item.id]) {
           try {
             const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
             const res = await axios.get(`${apiBaseUrl}/api/orders/product/${item.id}/bookings`);
             bookingsMap[item.id] = res.data.bookings || [];
             updated = true;
           } catch (e) {
             console.warn('Failed to fetch product booked dates:', e);
           }
         }
      }
      if (updated) {
        setProductBookings(bookingsMap);
      }
    };
    if (cart.length > 0) {
      fetchBookings();
    }
  }, [cart]);

  const getExcludedIntervals = (productId) => {
    const bookings = productBookings[productId] || [];
    return bookings.map(b => {
      const s = new Date(b.start_date);
      s.setHours(0, 0, 0, 0);
      const e = new Date(b.end_date);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    });
  };

  const checkDateOverlap = (productId, start, end) => {
    if (!start || !end) return true;
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    
    const bookings = productBookings[productId] || [];
    for (const b of bookings) {
      if (!b.start_date || !b.end_date) continue;
      const bs = new Date(b.start_date);
      const be = new Date(b.end_date);
      bs.setHours(0, 0, 0, 0);
      be.setHours(23, 59, 59, 999);
      if (s <= be && e >= bs) {
        return true;
      }
    }
    return false;
  };

  const handleStartChange = (item, date) => {
     if (item.end_date && date > new Date(item.end_date)) {
         updateRentalDates(item.id, date.toISOString(), date.toISOString());
     } else if (item.end_date) {
         if (checkDateOverlap(item.id, date, item.end_date)) {
             toast.error('Warning: These dates span across an already booked period.');
             return;
         }
         updateRentalDates(item.id, date.toISOString(), item.end_date);
     } else {
         updateRentalDates(item.id, date.toISOString(), null);
     }
  };

  const handleEndChange = (item, date) => {
     if (item.start_date) {
         if (date < new Date(item.start_date)) {
             toast.error('End date cannot be before start date.');
             return;
         }
         if (checkDateOverlap(item.id, item.start_date, date)) {
             toast.error('Warning: These dates span across an already booked period.');
             return;
         }
         updateRentalDates(item.id, item.start_date, date.toISOString());
     } else {
         updateRentalDates(item.id, null, date.toISOString());
     }
  };

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'rent10') {
      const discount = getCartTotal() * 0.1;
      setAppliedCoupon({ code: 'RENT10', discount });
      setSavingAmount(discount);
      toast.success('Coupon applied successfully!');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setSavingAmount(0);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout');
  };

  const calculateItemTotal = (item) => {
    return (item.rental_price_per_day || item.price || 0) * 
           (item.quantity || 1) * 
           (item.rentalDays || 1);
  };

  const cartTotal = getCartTotal();
  const securityDeposit = cart.reduce((sum, item) => 
    sum + (item.security_deposit || 0) * (item.quantity || 1), 0
  );
  const deliveryCharges = cartTotal > 500 ? 0 : 49;
  const finalTotal = cartTotal - savingAmount + securityDeposit + deliveryCharges;

  if (cart.length === 0) {
    return (
      <div className="fk-cart-page">
        <div className="fk-cart-empty">
          <div className="fk-empty-illustration">
            <ShoppingCart size={80} />
          </div>
          <h2>Your cart is empty!</h2>
          <p>Add items to your cart to see them here</p>
          <Link to="/" className="fk-btn-shop">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fk-cart-page">
      <div className="fk-cart-container">
        {/* Login Prompt */}
        {showLoginPrompt && !user && (
          <div className="fk-login-banner">
            <div className="fk-login-content">
              <div>
                <h3>Login to see your saved items</h3>
                <p>Get exclusive deals and faster checkout</p>
              </div>
              <div className="fk-login-actions">
                <button 
                  className="fk-btn-login"
                  onClick={() => navigate('/login', { state: { from: '/cart' } })}
                >
                  Login
                </button>
                <button 
                  className="fk-btn-skip"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fk-cart-layout">
          {/* Left: Cart Items */}
          <div className="fk-cart-items-section">
            <div className="fk-cart-header">
              <h1>Shopping Cart ({cart.length} item{cart.length > 1 ? 's' : ''})</h1>
              <span className="fk-delivery-to">
                <MapPin size={16} />
                Deliver to: <strong>New Delhi - 110001</strong>
              </span>
            </div>

            {/* Cart Items */}
            <div className="fk-cart-items">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="fk-cart-item">
                  <div className="fk-item-image">
                    <img 
                      src={item.photos?.[0]?.fullUrl || item.image_url || '/assets/images/placeholder.jpg'} 
                      alt={item.item_name || item.name}
                    />
                  </div>
                  
                  <div className="fk-item-details">
                    <h3 className="fk-item-name">
                      {item.item_name || item.name}
                    </h3>
                    
                    <p className="fk-item-category">
                      {item.category || item.cat || 'Category'}
                    </p>
                    
                    <div className="fk-item-seller">
                      Seller: {item.lender_name || item.lender || 'Verified Lender'}
                      <span className="fk-badge">Verified</span>
                    </div>

                    {/* Rental Dates Picker */}
                    <div className="fk-rental-control" style={{ flexDirection: 'column', alignItems: 'flex-start', background: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
                      <span className="fk-control-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Rental Dates</span>
                      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <div style={{ flex: 1, zIndex: 10 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Start</label>
                          <DatePicker
                            selected={item.start_date ? new Date(item.start_date) : null}
                            onChange={(date) => handleStartChange(item, date)}
                            minDate={new Date()}
                            excludeDateIntervals={getExcludedIntervals(item.id)}
                            placeholderText="Select start"
                            dateFormat="dd/MM/yyyy"
                            className="fk-date-picker-input-small"
                          />
                        </div>
                        <div style={{ flex: 1, zIndex: 10 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>End</label>
                          <DatePicker
                            selected={item.end_date ? new Date(item.end_date) : null}
                            onChange={(date) => handleEndChange(item, date)}
                            minDate={item.start_date ? new Date(item.start_date) : new Date()}
                            excludeDateIntervals={getExcludedIntervals(item.id)}
                            placeholderText="Select end"
                            dateFormat="dd/MM/yyyy"
                            className="fk-date-picker-input-small"
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#334155' }}>
                        Total Duration: <strong>{item.rentalDays || 1} day(s)</strong>
                      </div>
                    </div>


                  </div>

                  <div className="fk-item-pricing">
                    <div className="fk-item-price">
                      ₹{calculateItemTotal(item)}
                    </div>
                    <div className="fk-item-rate">
                      ₹{item.rental_price_per_day || item.price}/day
                    </div>
                    
                    <button 
                      className="fk-remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Actions */}
            <div className="fk-cart-actions">
              <button 
                className="fk-btn-continue"
                onClick={() => navigate('/')}
              >
                ← Continue Shopping
              </button>
              <button 
                className="fk-btn-clear"
                onClick={() => {
                  if (window.confirm('Clear all items from cart?')) {
                    clearCart();
                  }
                }}
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Right: Price Details */}
          <div className="fk-price-section">
            <div className="fk-price-card">
              <h3>Price Details</h3>
              
              <div className="fk-price-rows">
                <div className="fk-price-row">
                  <span>Price ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                  <span>₹{cartTotal}</span>
                </div>
                
                {savingAmount > 0 && (
                  <div className="fk-price-row fk-discount">
                    <span>Discount</span>
                    <span>-₹{savingAmount}</span>
                  </div>
                )}
                
                {securityDeposit > 0 && (
                  <div className="fk-price-row">
                    <span>Security Deposit (Refundable)</span>
                    <span>₹{securityDeposit}</span>
                  </div>
                )}
                
                <div className="fk-price-row">
                  <span>Delivery Charges</span>
                  <span className={deliveryCharges === 0 ? 'fk-free' : ''}>
                    {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                  </span>
                </div>
              </div>

              <div className="fk-price-total">
                <span>Total Amount</span>
                <span>₹{finalTotal}</span>
              </div>

              {savingAmount > 0 && (
                <div className="fk-savings">
                  You will save ₹{savingAmount} on this order
                </div>
              )}
            </div>

            {/* Coupon Section */}
            <div className="fk-coupon-card">
              <h4>
                <Percent size={16} />
                Apply Coupon
              </h4>
              
              {appliedCoupon ? (
                <div className="fk-applied-coupon">
                  <div className="fk-coupon-tag">
                    <span>{appliedCoupon.code}</span>
                    <button onClick={handleRemoveCoupon}>×</button>
                  </div>
                  <p>Coupon applied! You saved ₹{appliedCoupon.discount}</p>
                </div>
              ) : (
                <div className="fk-coupon-input">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                  >
                    Apply
                  </button>
                </div>
              )}
              
              <p className="fk-coupon-hint">Try RENT10 for 10% off</p>
            </div>

            {/* Checkout Button */}
            <button 
              className="fk-btn-checkout"
              onClick={handleCheckout}
            >
              <span>Place Order</span>
              <ArrowRight size={20} />
            </button>

            {/* Trust Badges */}
            <div className="fk-trust-badges">
              <div className="fk-trust-item">
                <ShieldCheck size={20} />
                <span>Secure Payments</span>
              </div>
              <div className="fk-trust-item">
                <Truck size={20} />
                <span>Free Delivery*</span>
              </div>
              <div className="fk-trust-item">
                <Clock size={20} />
                <span>7-Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Viewed / Saved for Later could go here */}
      </div>
    </div>
  );
}