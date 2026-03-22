// src/pages/AllCategories/index.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHomepageCategories } from '../../services/categories';
import Footer from '../Home/Footer';
import './index.css';

export default function AllCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const load = async () => {
      try {
        const data = await fetchHomepageCategories();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="all-categories-page">
      <div className="ac-header">
        <h1>All Categories</h1>
        <p>Browse our complete catalog of rental items.</p>
      </div>

      <div className="ac-container">
        {loading ? (
          <div className="ac-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="ac-skeleton" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="ac-empty">No categories found.</div>
        ) : (
          <div className="ac-grid">
            {categories.map((cat) => (
              <Link to={`/category/${cat.slug}`} key={cat.id} className="ac-card">
                <div className="ac-img-wrap">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} loading="lazy" />
                  ) : (
                    <div className="ac-fallback">
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3>{cat.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
