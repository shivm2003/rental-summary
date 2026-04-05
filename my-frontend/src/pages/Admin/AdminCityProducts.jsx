import React, { useState, useEffect } from 'react';
import { MapPin, Search, Package, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AdminCityProducts() {
  const [products, setProducts] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, [selectedCity, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      const res = await fetch(`${API_URL}/api/admin/city-products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setCities(data.cities);
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching city products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group products by city for summary
  const citySummary = {};
  products.forEach(p => {
    const c = (p.city || 'Unknown').trim();
    if (!citySummary[c]) citySummary[c] = { total: 0, active: 0 };
    citySummary[c].total++;
    if (p.status === 'active') citySummary[c].active++;
  });

  const statusColor = (s) => {
    if (s === 'active') return { bg: '#ecfdf5', color: '#10b981' };
    if (s === 'pending') return { bg: '#fffbeb', color: '#f59e0b' };
    if (s === 'rejected') return { bg: '#fef2f2', color: '#ef4444' };
    return { bg: '#f1f5f9', color: '#64748b' };
  };

  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .city-products-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .filter-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .filter-select { padding: 8px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: inherit; background: #fff; cursor: pointer; color: #0f172a; min-width: 160px; }
        .filter-select:focus { outline: none; border-color: #3b82f6; }
        .product-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        .product-table th { padding: 12px 14px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .product-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
        .product-table tr:hover td { background: #f8fafc; }
        .product-img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #f1f5f9; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
        .summary-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .summary-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; min-width: 140px; }
        .summary-city { font-size: 14px; font-weight: 600; color: #0f172a; }
        .summary-count { font-size: 22px; font-weight: 700; color: #3b82f6; }
        .summary-sub { font-size: 12px; color: #94a3b8; }
      `}</style>

      <div className="city-products-header">
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} color="#6366f1" /> Products by City
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>{products.length} products found</p>
        </div>
        <div className="filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} color="#64748b" />
            <select className="filter-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
              <option value="all">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select className="filter-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* City Summary Cards */}
      {selectedCity === 'all' && Object.keys(citySummary).length > 0 && (
        <div className="summary-row">
          {Object.entries(citySummary).slice(0, 8).map(([city, s]) => (
            <div key={city} className="summary-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedCity(city)}>
              <div className="summary-city">{city}</div>
              <div className="summary-count">{s.total}</div>
              <div className="summary-sub">{s.active} active</div>
            </div>
          ))}
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <Package size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div>No products found for the selected filters.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="product-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Product</th>
                  <th>Lender</th>
                  <th>City</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const sc = statusColor(p.status);
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="product-img" />
                        ) : (
                          <div className="product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} color="#cbd5e1" />
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500, color: '#0f172a' }}>{p.item_name}</td>
                      <td style={{ color: '#64748b' }}>{p.lender_name}</td>
                      <td>{p.city || 'Unknown'}</td>
                      <td style={{ color: '#64748b' }}>{p.category || '—'}</td>
                      <td style={{ fontWeight: 600 }}>₹{p.rental_price_per_day}/{p.price_unit || 'day'}</td>
                      <td>
                        <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>{p.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
