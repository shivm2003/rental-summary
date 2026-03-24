// src/pages/CategoryPage/index.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchHomepageCategories } from '../../services/categories';
import { fetchProducts } from '../../services/products';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-hot-toast';
import Footer from '../Home/Footer';
import './index.css';

// Reusable Image extractor
function getProductImage(product) {
  if (product.image_url && product.image_url.startsWith('http')) return product.image_url;
  const photo = product.photos?.[0];
  if (!photo) return null;
  if (photo.fullUrl && photo.fullUrl.startsWith('http')) return photo.fullUrl;
  if (photo.full_url && photo.full_url.startsWith('http')) return photo.full_url;
  const urlField = Object.values(photo).find(v => typeof v === 'string' && v.startsWith('http'));
  if (urlField) return urlField;
  if (photo.base64Preview) return photo.base64Preview;
  return null;
}

// Product Card matches Home
function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const price = product.rental_price_per_day || product.price || 0;
  const name  = (product.item_name || product.name || 'Unnamed Item').trim();
  const src   = getProductImage(product);
  const [imgFailed, setImgFailed] = useState(false);

  const handleRentNow = (e) => {
    e.stopPropagation();
    addToCart({ ...product, quantity: 1, rentalDays: 1, totalPrice: price });
    toast.success('Added to cart!');
    navigate('/cart');
  };

  return (
    <div className="cp-product-card" onClick={() => navigate(`/product/${product.id || product._id}`)}>
      <div className="cp-product-img-wrap">
        {src && !imgFailed ? (
          <img src={src} alt={name} className="cp-product-img" loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <div className="cp-product-no-img">📦</div>
        )}
      </div>
      <div className="cp-product-info">
        <h3 className="cp-product-name">{name}</h3>
        <div className="cp-product-price">
          ₹{Number(price).toLocaleString('en-IN')}<span>/day</span>
        </div>
        {(product.city || product.location) && (
          <div className="cp-product-location">📍 {(product.city || product.location).trim()}</div>
        )}
        <button className="cp-rent-btn" onClick={handleRentNow}>Rent Now</button>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Load category meta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const loadCat = async () => {
      try {
        const data = await fetchHomepageCategories();
        const found = data.categories?.find(c => c.slug === slug);
        if (found) setCategoryInfo(found);
      } catch (err) {
        console.error('Failed to load category info:', err);
      }
    };
    loadCat();
  }, [slug]);

  // Load products based on filters
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const filters = { cat: slug, sort };
        const res = await fetchProducts(filters);
        let items = res.listings || res.products || [];
        
        // Local fallback filter 
        if (minPrice) items = items.filter(i => (i.rental_price_per_day || i.price) >= Number(minPrice));
        if (maxPrice) items = items.filter(i => (i.rental_price_per_day || i.price) <= Number(maxPrice));
        
        setProducts(items);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug, sort, minPrice, maxPrice]);

  const formatCat = (catSlug) => catSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const title = categoryInfo?.name || formatCat(slug);

  return (
    <div className="category-page">
      {/* Hero Banner */}
      <div className="cp-hero" style={categoryInfo?.image_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${categoryInfo.image_url})` } : {}}>
        <div className="cp-hero-content">
          <nav className="cp-breadcrumb">
            <Link to="/">Home</Link> <span>›</span> <Link to="/categories">Categories</Link> <span>›</span> <strong>{title}</strong>
          </nav>
          <h1>{title} Rentals</h1>
          <p>Find the best items to rent in {title}. Secure, fast, and affordable.</p>
        </div>
      </div>

      <div className="cp-container">
        {/* Sidebar Filters */}
        <aside className="cp-sidebar">
          <div className="cp-filter-box">
            <h3>Filters</h3>
            
            <div className="cp-filter-group">
              <label>Price Range (/day)</label>
              <div className="cp-price-inputs">
                <input type="number" placeholder="Min ₹" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                <span>to</span>
                <input type="number" placeholder="Max ₹" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
            </div>

            <div className="cp-filter-group">
              <label>Condition</label>
              <div className="cp-checkboxes">
                <label><input type="checkbox" /> Like New</label>
                <label><input type="checkbox" /> Excellent</label>
                <label><input type="checkbox" /> Good</label>
              </div>
            </div>
            
            <button className="cp-clear-btn" onClick={() => { setMinPrice(''); setMaxPrice(''); setSort('newest'); }}>
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="cp-main">
          <div className="cp-toolbar">
            <span className="cp-results-count">
              Showing <strong>{products.length}</strong> items in {title}
            </span>
            <div className="cp-sort">
              <label>Sort By:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="popular">Popularity</option>
                <option value="price">Price: Low to High</option>
              </select>
            </div>
          </div>

          {loading ? (
             <div className="cp-grid">
               {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="cp-skeleton-card">
                   <div className="cp-skel-img"></div>
                   <div className="cp-skel-line w-full"></div>
                   <div className="cp-skel-line w-half"></div>
                 </div>
               ))}
             </div>
          ) : products.length === 0 ? (
            <div className="cp-empty">
              <p>No items found for this category with the current filters.</p>
              <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Reset Filters</button>
            </div>
          ) : (
            <div className="cp-grid">
              {products.map(p => <ProductCard key={p.id || p._id} product={p} />)}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
