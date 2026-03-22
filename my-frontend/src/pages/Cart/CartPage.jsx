// src/pages/Cart/CartPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Trash2, Plus, Minus, MapPin, ShieldCheck, 
  Truck, Package, ChevronRight, Percent, 
  Clock, ArrowRight
} from 'lucide-react';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    updateRentalDays,
    clearCart,
    getCartTotal 
  } = useCart();

  const [showLoginPrompt, setShowLoginPrompt] = useState(!user);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [savingAmount, setSavingAmount] = useState(0);

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

                    {/* Rental Duration */}
                    <div className="fk-rental-control">
                      <span className="fk-control-label">Rental Days:</span>
                      <div className="fk-qty-control">
                        <button 
                          onClick={() => updateRentalDays(item.id, Math.max(1, (item.rentalDays || 1) - 1))}
                          disabled={(item.rentalDays || 1) <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.rentalDays || 1}</span>
                        <button 
                          onClick={() => updateRentalDays(item.id, (item.rentalDays || 1) + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="fk-quantity-control">
                      <span className="fk-control-label">Quantity:</span>
                      <div className="fk-qty-control">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          disabled={(item.quantity || 1) <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        >
                          <Plus size={14} />
                        </button>
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