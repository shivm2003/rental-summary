// src/pages/Home/CategoryGrid.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepageCategories } from '../../services/categories';
import './CategoryGrid.css';

export default function CategoryGrid() {
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchHomepageCategories();
        if (mounted) { setCategories(data.categories || []); setError(null); }
      } catch (err) {
        if (mounted) { console.error('Failed to load categories:', err); setError(err.message); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleImageError = (id) =>
    setFailedImages((prev) => new Set([...prev, id]));

  const INITIAL_COLORS = [
    '#0ea5e9','#8b5cf6','#f59e0b','#10b981',
    '#ef4444','#f97316','#06b6d4','#ec4899',
  ];

  const renderCard = (category, index) => {
    const imageLoaded = category.image_url && !failedImages.has(category.id);
    const accentColor = INITIAL_COLORS[index % INITIAL_COLORS.length];

    return (
      <Link
        to={`/category/${category.slug}`}
        key={category.id}
        className="fk-card"
        aria-label={category.name}
      >
        {/*
          The signature Flipkart blob:
          – Rounded square with light-blue radial gradient background
          – Product image overflows the top (transform: translateY)
          – 3-D pop-out feel via drop-shadow on the image
        */}
        <div className="fk-blob">
          <div className="fk-blob-inner">
            {imageLoaded ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="fk-product-img"
                onError={() => handleImageError(category.id)}
                loading="lazy"
              />
            ) : (
              <div className="fk-fallback" style={{ color: accentColor }}>
                <span className="fk-initial">
                  {category.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="fk-label">{category.name}</p>
      </Link>
    );
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <section className="fk-section">
        <div className="fk-container">
          <div className="fk-header">
            <span className="fk-title">Rent by Category</span>
          </div>
          <div className="fk-grid-wrap">
            <div className="fk-grid">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="fk-skeleton">
                  <div className="fk-skeleton-blob" />
                  <div className="fk-skeleton-line" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if ((error && categories.length === 0) || categories.length === 0) return null;

  return (
    <section className="fk-section">
      <div className="fk-container">

        <div className="fk-header">
          <span className="fk-title">Rent by Category</span>
          <Link to="/categories" className="fk-view-all">
            View All <span className="fk-arrow">›</span>
          </Link>
        </div>

        {/*
          Two-row horizontal layout — matches the Flipkart screenshot:
          Row 1: Fashion, Travel, Electronics, Home & Kitchen … (first half)
          Row 2: Mobiles, Food & Health, Appliances … (second half)
          On desktop all visible; on smaller screens horizontally scrollable.
        */}
        <div className="fk-grid-wrap">
          <div className="fk-grid">
            {categories.map((cat, i) => renderCard(cat, i))}
          </div>
        </div>

      </div>
    </section>
  );
}