import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, Image, PlusCircle, Users, UserCheck,
  Package, Bell, Search, ChevronRight, MapPin,
  CloudUpload, Settings, Shield, Activity, TrendingUp
} from 'lucide-react';
import { fetchAdminCategories } from '../../services/categories';
import { fetchAllBanners } from '../../services/hero';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AdminDashboard() {
  const [storageStats, setStorageStats] = useState({ categories: 0, banners: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // New stats
  const [stats, setStats] = useState({ users: {}, lenders: {}, products: {}, cityStats: [], revenue: {} });
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [catsRes, bannersRes, statsRes] = await Promise.all([
        fetchAdminCategories(),
        fetchAllBanners(),
        fetch(`${API_URL}/api/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => null)
      ]);

      const catCount = catsRes?.categories?.length ?? catsRes?.data?.categories?.length ?? 0;
      const bannerCount = bannersRes?.banners?.length ?? bannersRes?.data?.banners?.length ?? 0;
      setStorageStats({ categories: catCount, banners: bannerCount });

      if (statsRes) {
        setStats({
          users: statsRes.users || {},
          lenders: statsRes.lenders || {},
          products: statsRes.products || {},
          cityStats: statsRes.cityStats || [],
          revenue: statsRes.revenue || {}
        });
        setRecentActivity(statsRes.recentActivity || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = stats.cityStats.filter(c =>
    !cityFilter || c.city.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const quickActions = [
    { icon: FolderOpen, label: 'Categories', to: '/admin/categories', color: '#3b82f6', bg: '#eff6ff', count: storageStats.categories, unit: 'total' },
    { icon: Image, label: 'Hero Banners', to: '/admin/hero', color: '#8b5cf6', bg: '#f5f3ff', count: storageStats.banners, unit: 'active' },
    { icon: PlusCircle, label: 'Add Listing', to: '/list-product', color: '#10b981', bg: '#ecfdf5', count: null, unit: 'new rental' },
    { icon: CloudUpload, label: 'S3 Storage', to: '/admin/storage', color: '#f59e0b', bg: '#fffbeb', count: '2.4 GB', unit: 'used' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#64748b' }}>
      Loading dashboard...
    </div>
  );

  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .dash-title { font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
        .dash-subtitle { color: #64748b; font-size: 14px; margin-top: 2px; }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .search-box { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; font-size: 14px; color: #94a3b8; }
        .search-box input { border: none; outline: none; background: transparent; font-size: 14px; color: #0f172a; width: 200px; }
        .notif-btn { position: relative; width: 40px; height: 40px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
        .notif-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #f0f2f5; }
        .section-label { font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 14px; }
        .actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .action-card { background: #fff; border-radius: 14px; padding: 20px; text-decoration: none; display: flex; flex-direction: column; gap: 12px; border: 1px solid #e2e8f0; transition: all 0.2s ease; position: relative; overflow: hidden; }
        .action-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: transparent; }
        .action-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .action-label { font-size: 15px; font-weight: 600; color: #0f172a; }
        .action-count { font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -1px; line-height: 1; }
        .action-unit { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .action-arrow { position: absolute; top: 20px; right: 20px; color: #cbd5e1; }
        .stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; border-radius: 14px; padding: 22px; border: 1px solid #e2e8f0; }
        .stat-card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .stat-card-val { font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: -1px; line-height: 1; }
        .stat-card-label { font-size: 14px; color: #64748b; margin-top: 6px; font-weight: 500; }
        .stat-card-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .card { background: #fff; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0; }
        .activity-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .activity-item:last-child { border-bottom: none; }
        .activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .dot-add { background: #10b981; }
        .dot-update { background: #3b82f6; }
        .activity-action { font-size: 14px; font-weight: 500; color: #0f172a; }
        .activity-item-name { font-size: 13px; color: #64748b; }
        .activity-time { font-size: 12px; color: #94a3b8; margin-left: auto; white-space: nowrap; padding-left: 12px; }
        .city-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        .city-table th { padding: 10px 14px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 13px; }
        .city-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
        .city-table tr:hover td { background: #f8fafc; }
        .city-badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 13px; font-weight: 600; }
        @media (max-width: 900px) {
          .stat-cards, .actions-grid { grid-template-columns: repeat(2, 1fr); }
          .main-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="dash-title">Admin Dashboard</div>
          <div className="dash-subtitle">EveryThingRental — Overview</div>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Search categories, banners..." />
          </div>
          <button className="notif-btn">
            <Bell size={18} />
            <span className="notif-badge">3</span>
          </button>
        </div>
      </div>

      {/* ===== Stat Cards: Users, Lenders, Products, Revenue ===== */}
      <div className="section-label">Platform Overview</div>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><Users size={22} /></div>
          <div className="stat-card-val">{stats.users.total || 0}</div>
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-sub">{stats.users.active || 0} active · {stats.users.newThisWeek || 0} new this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#fdf2f8', color: '#ec4899' }}><UserCheck size={22} /></div>
          <div className="stat-card-val">{stats.lenders.total || 0}</div>
          <div className="stat-card-label">Total Lenders</div>
          <div className="stat-card-sub">Approved lenders on platform</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><Package size={22} /></div>
          <div className="stat-card-val">{stats.products.total || 0}</div>
          <div className="stat-card-label">Total Products</div>
          <div className="stat-card-sub">{stats.products.active || 0} active · {stats.products.newThisMonth || 0} new this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}><TrendingUp size={22} /></div>
          <div className="stat-card-val">₹{(stats.revenue.total || 0).toLocaleString('en-IN')}</div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-sub">{stats.revenue.orders || 0} completed orders</div>
        </div>
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="section-label">Management Controls</div>
      <div className="actions-grid">
        {quickActions.map((a, i) => (
          <Link key={i} to={a.to} className="action-card">
            <ChevronRight size={16} className="action-arrow" />
            <div className="action-icon" style={{ background: a.bg, color: a.color }}>
              <a.icon size={20} />
            </div>
            <div className="action-label">{a.label}</div>
            {a.count !== null && <div className="action-count">{a.count}</div>}
            <div className="action-unit">{a.unit}</div>
          </Link>
        ))}
      </div>

      {/* ===== City-wise Products + Recent Activity ===== */}
      <div className="main-grid">
        {/* City Products */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              <MapPin size={16} color="#6366f1" /> Products by City
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px' }}>
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Filter city..."
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: 120 }}
              />
            </div>
          </div>
          {filteredCities.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No products found.</p>
          ) : (
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              <table className="city-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Total</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCities.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{c.city}</td>
                      <td><span className="city-badge" style={{ background: '#eff6ff', color: '#3b82f6' }}>{parseInt(c.total)}</span></td>
                      <td><span className="city-badge" style={{ background: '#ecfdf5', color: '#10b981' }}>{parseInt(c.active)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
            <Activity size={16} color="#3b82f6" /> Recent Activity
          </div>
          {recentActivity.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No recent activity.</p>
          ) : (
            recentActivity.map(a => (
              <div key={a.id} className="activity-item">
                <div className={`activity-dot dot-${a.type}`} />
                <div>
                  <div className="activity-action">{a.action}</div>
                  <div className="activity-item-name">{a.item}</div>
                </div>
                <span className="activity-time">{a.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}