// src/pages/ProductDetail/index.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProduct } from '../../services/products';
import { fetchProducts } from '../../services/products';
import { getGalleryImages, getMainImage } from '../../services/images';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Heart, Share2, Truck, ShieldCheck, RotateCcw, 
  ChevronLeft, ChevronRight, Star, MapPin, 
  Minus, Plus, ShoppingCart, Zap
} from 'lucide-react';
import './index.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProduct(id);
        
        if (!data) {
          setError('Product not found');
          return;
        }
        
        setProduct(data);
        
        // Load related products from same category
        const related = await fetchProducts({ 
          cat: data.category || data.cat, 
          limit: 6,
          exclude: id 
        });
        setRelatedProducts(related.listings || related.products || []);
        
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id]);

  // Calculate delivery date based on pincode
  const checkDelivery = () => {
    if (pincode.length === 6) {
      const days = Math.floor(Math.random() * 3) + 2; // 2-4 days
      const date = new Date();
      date.setDate(date.getDate() + days);
      setDeliveryDate(date.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      }));
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      ...product,
      quantity,
      rentalDays,
      totalPrice: calculateTotal()
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleStartChat = async () => {
    if (!user) {
      toast.error('Please login to chat with the lender.');
      navigate('/login');
      return;
    }
    
    if (user.id == product.lender_id) {
      toast.error('You cannot chat with yourself on your own product.');
      return;
    }
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chat/rooms`, {
        lenderId: product.lender_id,
        listingId: product.id || product._id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      navigate('/chat');
    } catch (err) {
      console.error('Error starting chat', err);
      toast.error('Could not start chat');
    }
  };

  const calculateTotal = () => {
    const price = product?.rental_price_per_day || product?.price || 0;
    return price * quantity * rentalDays;
  };

  const calculateDiscount = () => {
    const original = (product?.original_price || product?.mrp || 0);
    const current = (product?.rental_price_per_day || product?.price || 0);
    if (original > current) {
      return Math.round(((original - current) / original) * 100);
    }
    return 0;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="fk-product-detail">
        <div className="fk-container">
          <div className="fk-skeleton-grid">
            <div className="fk-skeleton-image" />
            <div className="fk-skeleton-info">
              <div className="fk-skeleton-line w-3/4" />
              <div className="fk-skeleton-line w-1/2" />
              <div className="fk-skeleton-line w-full" />
              <div className="fk-skeleton-line w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="fk-product-detail">
        <div className="fk-error-state">
          <div className="fk-error-icon">😕</div>
          <h2>Product Not Found</h2>
          <p>{error || "The product you're looking for doesn't exist."}</p>
          <button onClick={() => navigate('/')} className="fk-btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const images = getGalleryImages(product.photos);
  const mainImage = images[selectedImage] || getMainImage(product.photos);
  const discount = calculateDiscount();
  const price = product.rental_price_per_day || product.price || 0;
  const mrp = product.original_price || product.mrp || price * 1.2;
  const totalPrice = calculateTotal();

  return (
    <div className="fk-product-detail">
      {/* Breadcrumb */}
      <div className="fk-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={`/category/${product.category || product.cat}`}>
          {product.category || product.cat || 'Category'}
        </Link>
        <span>/</span>
        <span className="current">{product.item_name || product.name}</span>
      </div>

      <div className="fk-container">
        <div className="fk-product-layout">
          {/* Left: Image Gallery */}
          <div className="fk-gallery-section">
            <div className="fk-image-sticky">
              {/* Main Image */}
              <div className="fk-main-image-wrapper">
                <div className="fk-image-actions">
                  <button 
                    className={`fk-action-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart size={20} fill={isWishlisted ? "#ff424f" : "none"} />
                  </button>
                  <button className="fk-action-btn">
                    <Share2 size={20} />
                  </button>
                </div>
                
                <img 
                  src={mainImage} 
                  alt={product.item_name || product.name}
                  className="fk-main-image"
                  onError={(e) => {
                    e.target.src = '/assets/images/placeholder.jpg';
                  }}
                />
                
                {images.length > 1 && (
                  <>
                    <button 
                      className="fk-nav-arrow fk-prev"
                      onClick={() => setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      className="fk-nav-arrow fk-next"
                      onClick={() => setSelectedImage(prev => (prev + 1) % images.length)}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="fk-thumbnails">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      className={`fk-thumb ${selectedImage === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img src={img} alt={`View ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="fk-action-buttons">
                <button className="fk-btn-cart" onClick={handleAddToCart}>
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button className="fk-btn-buy" onClick={handleBuyNow}>
                  <Zap size={20} />
                  Rent Now
                </button>
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="fk-info-section">
            {/* Title & Rating */}
            <div className="fk-product-header">
              <h1 className="fk-product-title">
                {product.item_name || product.name}
              </h1>
              
              <div className="fk-rating-row">
                <div className="fk-rating-badge">
                  <span className="fk-rating-value">4.3</span>
                  <Star size={14} fill="white" />
                </div>
                <span className="fk-rating-count">2,847 ratings & 412 reviews</span>
                {product.brand && (
                  <span className="fk-brand-badge">{product.brand}</span>
                )}
              </div>
            </div>

            {/* Price Section */}
            <div className="fk-price-section">
              <div className="fk-price-row">
                <span className="fk-current-price">₹{price}</span>
                <span className="fk-per-day">/day</span>
              </div>
              
              {discount > 0 && (
                <div className="fk-price-details">
                  <span className="fk-mrp">₹{mrp}</span>
                  <span className="fk-discount">{discount}% off</span>
                </div>
              )}
              
              <div className="fk-tax-note">Inclusive of all taxes</div>
            </div>

            {/* Offers */}
            <div className="fk-offers-section">
              <h3>Available Offers</h3>
              <div className="fk-offer-list">
                <div className="fk-offer">
                  <span className="fk-offer-icon">🏷️</span>
                  <span>Bank Offer: 5% Unlimited Cashback on Flipkart Axis Bank Credit Card</span>
                </div>
                <div className="fk-offer">
                  <span className="fk-offer-icon">🎁</span>
                  <span>Special Price: Get extra 10% off (price inclusive of cashback/coupon)</span>
                </div>
                <div className="fk-offer">
                  <span className="fk-offer-icon">🚚</span>
                  <span>Free delivery on first 3 orders</span>
                </div>
              </div>
            </div>

            {/* Rental Duration Selector */}
            <div className="fk-rental-section">
              <h3>Rental Duration</h3>
              <div className="fk-duration-selector">
                <button 
                  className="fk-qty-btn"
                  onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}
                >
                  <Minus size={16} />
                </button>
                <span className="fk-duration-value">{rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                <button 
                  className="fk-qty-btn"
                  onClick={() => setRentalDays(rentalDays + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {/* Total Calculation */}
              <div className="fk-total-calc">
                <div className="fk-calc-row">
                  <span>Rental Price ({rentalDays} day{rentalDays > 1 ? 's' : ''})</span>
                  <span>₹{price * rentalDays}</span>
                </div>
                {Number(product.security_deposit || 0) > 0 && (
                  <div className="fk-calc-row">
                    <span>Security Deposit (Refundable)</span>
                    <span>₹{Number(product.security_deposit)}</span>
                  </div>
                )}
                <div className="fk-calc-row fk-total">
                  <span>Total Amount</span>
                  <span>₹{totalPrice + Number(product.security_deposit || 0)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Check */}
            <div className="fk-delivery-section">
              <h3>Delivery & Services</h3>
              <div className="fk-pincode-check">
                <MapPin size={20} />
                <input
                  type="text"
                  placeholder="Enter delivery pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <button 
                  onClick={checkDelivery}
                  disabled={pincode.length !== 6}
                >
                  Check
                </button>
              </div>
              
              {deliveryDate && (
                <div className="fk-delivery-info">
                  <Truck size={18} />
                  <span>Delivery by <strong>{deliveryDate}</strong></span>
                </div>
              )}
              
              <div className="fk-service-list">
                <div className="fk-service">
                  <RotateCcw size={18} />
                  <span>7 Days Replacement Policy</span>
                </div>
                <div className="fk-service">
                  <Truck size={18} />
                  <span>Free Delivery</span>
                </div>
                <div className="fk-service">
                  <ShieldCheck size={18} />
                  <span>1 Year Warranty</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="fk-description-section">
              <h3>Description</h3>
              <div className={`fk-description ${!showFullDescription ? 'collapsed' : ''}`}>
                <p>{product.description || 'No description available'}</p>
                {product.specifications && (
                  <div className="fk-specs">
                    <h4>Specifications</h4>
                    <table>
                      <tbody>
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {(product.description?.length > 200 || product.specifications) && (
                <button 
                  className="fk-read-more"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? 'Read Less' : 'Read More'}
                </button>
              )}
            </div>

            {/* Lender Info */}
            <div className="fk-lender-section">
              <h3>Lender Information</h3>
              <div className="fk-lender-card">
                <div className="fk-lender-avatar">
                  {(product.lender_name || product.lender || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="fk-lender-info">
                  <h4>{product.lender_name || product.lender || 'Verified Lender'}</h4>
                  <p>Member since 2023 • 98% Positive ratings</p>
                </div>
                <button className="fk-chat-btn" onClick={handleStartChat}>Chat with Lender</button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="fk-related-section">
            <div className="fk-section-header">
              <h2>Similar Products</h2>
              <Link to={`/category/${product.category || product.cat}`} className="fk-view-all">
                View All
              </Link>
            </div>
            
            <div className="fk-related-grid">
              {relatedProducts.map((item) => (
                <Link 
                  to={`/product/${item.id || item._id}`} 
                  key={item.id || item._id}
                  className="fk-related-card"
                >
                  <div className="fk-related-image">
                    <img 
                      src={getMainImage(item.photos)} 
                      alt={item.item_name || item.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="fk-related-info">
                    <h4 className="fk-related-name">{item.item_name || item.name}</h4>
                    <div className="fk-related-price">
                      <span className="fk-related-current">₹{item.rental_price_per_day || item.price}</span>
                      <span className="fk-related-per">/day</span>
                    </div>
                    {item.location && (
                      <p className="fk-related-location">{item.location}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}