import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, Image, PlusCircle, TrendingUp, Users,
  Package, Bell, Search, ChevronRight,
  CloudUpload, Settings, Shield, Activity
} from 'lucide-react';
import { fetchAdminCategories } from '../../services/categories';
import { fetchAllBanners } from '../../services/hero';

export default function AdminDashboard() {
  const [storageStats, setStorageStats] = useState({ categories: 0, banners: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const [catsRes, bannersRes] = await Promise.all([
        fetchAdminCategories(),
        fetchAllBanners()
      ]);

      const catCount = catsRes?.categories?.length ?? catsRes?.data?.categories?.length ?? 0;
      const bannerCount = bannersRes?.banners?.length ?? bannersRes?.data?.banners?.length ?? 0;

      setStorageStats({ categories: catCount, banners: bannerCount });

      setRecentActivity([
        { id: 1, action: 'Category image uploaded', item: 'Electronics', time: '2 mins ago', type: 'add' },
        { id: 2, action: 'Hero banner updated', item: 'Summer Sale', time: '15 mins ago', type: 'update' },
        { id: 3, action: 'New category created', item: 'Vehicles', time: '1 hour ago', type: 'add' },
      ]);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

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
        .search-box {
          display: flex; align-items: center; gap: 8px;
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 8px 14px;
          font-size: 14px; color: #94a3b8;
        }
        .search-box input { border: none; outline: none; background: transparent; font-size: 14px; color: #0f172a; width: 200px; }
        .notif-btn {
          position: relative; width: 40px; height: 40px;
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b;
        }
        .notif-badge {
          position: absolute; top: -4px; right: -4px;
          background: #ef4444; color: #fff;
          font-size: 10px; font-weight: 700;
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #f0f2f5;
        }

        .section-label { font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 14px; }
        .section-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }

        .actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .action-card {
          background: #fff; border-radius: 14px; padding: 20px;
          text-decoration: none; display: flex; flex-direction: column; gap: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease; position: relative; overflow: hidden;
        }
        .action-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: transparent; }
        .action-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .action-label { font-size: 15px; font-weight: 600; color: #0f172a; }
        .action-count { font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -1px; line-height: 1; }
        .action-unit { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .action-arrow { position: absolute; top: 20px; right: 20px; color: #cbd5e1; }

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

        .storage-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .storage-row:last-child { border-bottom: none; }
        .storage-key { font-size: 14px; color: #64748b; }
        .storage-val { font-size: 14px; font-weight: 600; color: #0f172a; }
        .progress-track { background: #f1f5f9; border-radius: 99px; height: 6px; margin-top: 14px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #3b82f6, #6366f1); }

        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .status-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .status-item:last-child { border-bottom: none; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-top: 5px; flex-shrink: 0; }
        .status-item strong { font-size: 13px; font-weight: 600; color: #0f172a; display: block; }
        .status-item p { font-size: 12px; color: #94a3b8; margin-top: 2px; }

        .tips-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .tips-list li { font-size: 13px; color: #64748b; padding: 8px 12px; background: #f8fafc; border-radius: 8px; }
        .tips-list code { background: #e0e7ff; color: #4338ca; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
        .card-heading { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
      `}</style>

      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="dash-title">Admin Dashboard</div>
          <div className="dash-subtitle">Everything Rental — Image Management System</div>
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

      {/* Quick Action Cards */}
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

      {/* Middle Grid */}
      <div className="main-grid">
        {/* Activity */}
        <div className="card">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="#3b82f6" /> Recent Activity
          </div>
          {recentActivity.map(a => (
            <div key={a.id} className="activity-item">
              <div className={`activity-dot dot-${a.type}`} />
              <div>
                <div className="activity-action">{a.action}</div>
                <div className="activity-item-name">{a.item}</div>
              </div>
              <span className="activity-time">{a.time}</span>
            </div>
          ))}
        </div>

        {/* S3 Storage */}
        <div className="card">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloudUpload size={16} color="#f59e0b" /> S3 Storage Status
          </div>
          <div className="storage-row">
            <span className="storage-key">Categories</span>
            <span className="storage-val">{storageStats.categories} folders</span>
          </div>
          <div className="storage-row">
            <span className="storage-key">Hero Banners</span>
            <span className="storage-val">{storageStats.banners} images</span>
          </div>
          <div className="storage-row">
            <span className="storage-key">Storage Used</span>
            <span className="storage-val">2.4 GB / 10 GB</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '24%' }} />
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>24% of free tier used</p>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        <div className="card">
          <div className="card-heading"><Shield size={16} color="#10b981" /> Image Fallback System</div>
          {[
            { title: 'Category Defaults', desc: 'Shows default image when category has no S3 image' },
            { title: 'Hero Banner Sync', desc: 'Active banners sync with homepage carousel' },
            { title: 'S3 Folder Structure', desc: 'categories/ | hero-banners/ | listings/ | defaults/' },
          ].map((item, i) => (
            <div key={i} className="status-item">
              <div className="status-dot" />
              <div>
                <strong>{item.title}</strong>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-heading"><Settings size={16} color="#6366f1" /> Image Management Tips</div>
          <ul className="tips-list">
            <li>Upload category images to <code>categories/{'{slug}'}/</code> folder</li>
            <li>Hero banners auto-sync to homepage within 5 minutes</li>
            <li>Set default images in <code>defaults/</code> folder for fallbacks</li>
            <li>Use WebP format for faster loading (auto-converted)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}