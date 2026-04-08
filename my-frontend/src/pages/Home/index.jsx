import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import HeroBanner from './HeroBanner';
import CategoryGrid from './CategoryGrid';
import Footer from './Footer';
import { fetchProducts } from '../../services/products';
import { fetchHomepageCategories } from '../../services/categories';
import { useCart } from '../../contexts/CartContext';
import { useLocationContext } from '../../contexts/LocationContext';
import { toast } from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import axios from 'axios';
import { Helmet } from 'react-helmet';
import './index.css';

// Get the best S3 image URL — never use base64 as primary src
function getProductImage(product) {
  if (product.image_url && product.image_url.startsWith('http')) return product.image_url;

  const photo = product.photos?.[0];
  if (!photo) return null;

  if (photo.fullUrl && photo.fullUrl.startsWith('http')) return photo.fullUrl;
  if (photo.full_url && photo.full_url.startsWith('http')) return photo.full_url;

  const urlField = Object.values(photo).find(
    v => typeof v === 'string' && v.startsWith('http')
  );
  if (urlField) return urlField;

  if (photo.base64Preview) return photo.base64Preview;

  return null;
}

// Flipkart-style product card
function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const price = product.rental_price_per_day || product.price || 0;
  const name = (product.item_name || product.name || 'Unnamed Item').trim();
  const src = getProductImage(product);
  const [imgFailed, setImgFailed] = useState(false);

  const handleCardClick = () => {
    navigate(`/product/${product.id || product._id}`);
  };

  const handleRentNow = (e) => {
    e.stopPropagation();
    addToCart({
      ...product,
      quantity: 1,
      rentalDays: 1,
      totalPrice: price
    });
    toast.success('Added to cart!');
    navigate('/cart');
  };

  return (
    <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="product-img-wrap">
        {src && !imgFailed ? (
          <img
            src={src}
            alt={name}
            className="product-img"
            loading="lazy"
            onError={(e) => {
              console.warn('Image failed to load:', src, e);
              setImgFailed(true);
            }}
          />
        ) : (
          <div className="product-no-img">📦</div>
        )}
      </div>
      <div className="product-name">{name}</div>
      <div className="product-price">
        ₹{Number(price).toLocaleString('en-IN')}
        <span className="product-price-unit">/{product.price_unit || 'day'}</span>
      </div>
      {(product.min_rental_days > 1) && (
        <div style={{ fontSize: '11px', color: '#878787', marginTop: '2px', fontWeight: '500' }}>
          Min. rent: {product.min_rental_days} days
        </div>
      )}
      {product.location && (
        <div className="product-location">
          <span>📍</span> {product.location.trim()}
        </div>
      )}
      <button
        className="rent-now-btn"
        onClick={handleRentNow}
        style={{
          marginTop: '8px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #fb641b 0%, #ff9f00 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '600',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 12px rgba(251, 100, 27, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Rent Now
      </button>
    </div>
  );
}

// Skeleton loader
function SkeletonGrid({ count = 6 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-line" style={{ width: '90%' }} />
          <div className="skeleton skeleton-line" style={{ width: '60%' }} />
          <div className="skeleton skeleton-line" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

// Product section
function ProductSection({ title, products, loading }) {
  if (loading) return (
    <div className="section-wrap">
      <div className="section-heading">{title}</div>
      <SkeletonGrid count={6} />
    </div>
  );
  if (!products.length) return (
    <div className="section-wrap">
      <div className="section-heading">{title}</div>
      <div style={{ textAlign: 'center', padding: '40px', color: '#878787' }}>
        <p>No products found in this category.</p>
        <Link to="/" style={{ color: '#2874f0', textDecoration: 'none' }}>Browse all categories</Link>
      </div>
    </div>
  );
  return (
    <div className="section-wrap">
      <div className="section-heading">{title}</div>
      <div className="products-grid">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const { slug } = useParams(); // Get category slug from /category/:slug
  const navigate = useNavigate();

  // Support both /category/:slug and ?cat=category-name formats
  const categoryFromQuery = searchParams.get('cat');
  const category = slug || categoryFromQuery; // Prefer URL param, fallback to query param
  const searchQuery = searchParams.get('q');

  const { district, city, setShowPicker } = useLocationContext();
  // city is stored when user picks or GPS detects — matches l.location / l.city in backend
  const locationLabel = city || district || '';

  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({
    category: false, featured: false, trending: false, new: false, search: false
  });
  const [errors, setErrors] = useState({});

  // Subscription state
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Handle Subscription
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subEmail.trim() && !subPhone.trim()) {
      toast.error('Please enter either your Email or Mobile Number to subscribe');
      return;
    }

    setIsSubscribing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const { data } = await axios.post(`${API_URL}/api/subscriptions`, {
        email: subEmail.trim() || undefined,
        phone: subPhone.trim() || undefined
      });
      toast.success(data.message || 'Successfully subscribed!');
      setSubEmail('');
      setSubPhone('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed. Try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const loadProducts = useCallback(async (filters, setter, key) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    try {
      const res = await fetchProducts(filters);
      const items = res.listings || res.products || [];
      setter(items);
    } catch (err) {
      setErrors(prev => ({ ...prev, [key]: err.message }));
      setter([]);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (searchQuery) {
      loadProducts({ search: searchQuery, limit: 50, ...(locationLabel ? { city: locationLabel } : {}) }, setSearchResults, 'search');
    } else if (category) {
      loadProducts({ cat: category, limit: 20, ...(locationLabel ? { city: locationLabel } : {}) }, setCategoryProducts, 'category');
    } else {
      const locFilter = locationLabel ? { city: locationLabel } : {};
      Promise.all([
        loadProducts({ sort: 'popular', limit: 10, ...locFilter }, setTrending, 'trending'),
        loadProducts({ sort: 'rating', limit: 10, ...locFilter }, setFeatured, 'featured'),
        loadProducts({ sort: 'newest', limit: 10, ...locFilter }, setNewArrivals, 'new'),
      ]);
    }
  }, [category, searchQuery, loadProducts, locationLabel]);

  const [seoCategories, setSeoCategories] = useState([]);

  useEffect(() => {
    fetchHomepageCategories().then(data => {
      if (data?.categories?.length) {
        setSeoCategories(data.categories.map(c => c.name));
      }
    }).catch(e => console.error('Failed to load DB SEO categories:', e));
  }, []);

  const formatCat = (cat) =>
    cat ? cat.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '';

  // Breadcrumb for category filter page
  const CategoryBreadcrumb = () => {
    if (!category) return null;
    return (
      <div className="section-wrap" style={{ padding: '12px 16px', marginBottom: '12px' }}>
        <nav style={{ fontSize: '14px', color: '#878787' }}>
          <Link to="/" style={{ color: '#2874f0', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: '#212121', fontWeight: '500' }}>{formatCat(category)}</span>
        </nav>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#212121',
          marginTop: '12px',
          marginBottom: '4px'
        }}>
          {formatCat(category)} Rentals
        </h1>
        <p style={{ fontSize: '14px', color: '#878787', margin: 0 }}>
          Showing available items for rent in this category
        </p>
      </div>
    );
  };

  // Format Dynamic SEO
  const defaultCats = ['electronics', 'furniture', 'vehicles', 'cameras', 'electric equipment', 'machines'];
  const catsToUse = seoCategories.length > 0 ? seoCategories : defaultCats;
  
  const seoDesc = `Rent ${catsToUse.join(', ')} and more at affordable prices${locationLabel ? ` in ${locationLabel}` : ' near you'}.`;
  const seoKeys = `rental near me, rent ${catsToUse.join(', rent ')}, rental services in India${locationLabel ? `, rent in ${locationLabel}` : ''}`;

  return (
    <div className="home-page">
      <Helmet>
        <title>{locationLabel ? `Rent Products in ${locationLabel} | EverythingRental` : 'Rent Products Online in India | EverythingRental'}</title>
        <meta name="description" content={seoDesc} />
        <meta name="keywords" content={seoKeys} />
      </Helmet>

      {!category && !searchQuery && <HeroBanner />}

      <div className="content-container">
        {!category && !searchQuery && (
          <div className="section-wrap" style={{ marginTop: '20px' }}>
            <div className="section-heading">Rent Category</div>
            <CategoryGrid />
          </div>
        )}

        {/* Location Banner */}
        {!searchQuery && locationLabel && (
          <div className="location-banner">
            <MapPin size={16} />
            <span>Showing products available in: <strong>{locationLabel}</strong></span>
            <button className="location-change-btn" onClick={() => setShowPicker(true)}>Change</button>
          </div>
        )}

        {/* Breadcrumb for category page */}
        {category && !searchQuery && <CategoryBreadcrumb />}

        {!category && !searchQuery && (
          <div className="trust-badges">
            <div className="badges-grid">
              {[
                { icon: '🛡️', text: 'Verified Lenders' },
                { icon: '⚡', text: 'Instant Booking' },
                { icon: '💰', text: 'Best Prices' },
                { icon: '🔄', text: 'Easy Returns' },
              ].map((b, i) => (
                <div key={i} className="badge">
                  <span className="badge-icon">{b.icon}</span>
                  <span className="badge-text">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.category && <div className="error-banner">⚠️ {errors.category}</div>}
        {errors.search && <div className="error-banner">⚠️ {errors.search}</div>}

        {searchQuery ? (
          <ProductSection
            title={`Search Results for "${searchQuery}"`}
            products={searchResults}
            loading={loading.search}
          />
        ) : category ? (
          <ProductSection
            title={`${formatCat(category)} Rentals`}
            products={categoryProducts}
            loading={loading.category}
          />
        ) : (
          <>
            <ProductSection title="🔥 Trending Now" products={trending} loading={loading.trending} />
            <ProductSection title="⭐ Featured Rentals" products={featured} loading={loading.featured} />
            <ProductSection title="✨ New Arrivals" products={newArrivals} loading={loading.new} />
          </>
        )}
      </div>

      {!category && !searchQuery && (
        <div className="newsletter-section" style={{ padding: '60px 20px', backgroundColor: '#cf1417ff' }}>
          <h3 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: '#212121', marginBottom: '8px' }}>Get Exclusive Deals</h3>
          <p style={{ textAlign: 'center', color: 'black', marginBottom: '40px', fontSize: '15px' }}>Subscribe for new listings and special offers</p>

          <form onSubmit={handleSubscribe} style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '32px', justifyContent: 'center' }}>

              {/* Left Side - Email */}
              <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#212121' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your Email"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', border: '1px solid #e0e0e0', borderRadius: '4px', outline: 'none', fontSize: '15px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2874f0'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              {/* Right Side - Phone */}
              <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#212121' }}>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="Enter Mobile Number"
                  value={subPhone}
                  onChange={(e) => setSubPhone(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', border: '1px solid #e0e0e0', borderRadius: '4px', outline: 'none', fontSize: '15px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2874f0'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '14px', color: 'black' }}>
              Fill in either your Email <span style={{ fontWeight: 'bold' }}>OR</span> Mobile Number to subscribe.
            </div>

            <button
              type="submit"
              disabled={isSubscribing || (!subEmail.trim() && !subPhone.trim())}
              style={{
                padding: '14px 48px',
                backgroundColor: (!subEmail.trim() && !subPhone.trim()) ? '#c2c2c2' : '#2874f0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (!subEmail.trim() && !subPhone.trim()) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
                marginTop: '8px',
                boxShadow: (!subEmail.trim() && !subPhone.trim()) ? 'none' : '0 4px 12px rgba(40, 116, 240, 0.3)'
              }}
              onMouseDown={(e) => { if (subEmail.trim() || subPhone.trim()) e.target.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.target.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              {isSubscribing ? 'Subscribing...' : 'Subscribe Now'}
            </button>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
}