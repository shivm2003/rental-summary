import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, FolderOpen, Image as ImageIcon, LogOut, Zap, MessageSquare } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { path: '/admin/approvals', icon: FolderOpen, label: 'Pending Approvals' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categories' },
    { path: '/admin/hero', icon: ImageIcon, label: 'Hero Banners' },
    { path: '/admin/queries', icon: MessageSquare, label: 'Customer Queries' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sidebar-logo {
          padding: 24px 20px;
          border-bottom: 1px solid #1e293b;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text { color: #f8fafc; font-weight: 700; font-size: 16px; letter-spacing: -0.3px; }
        .logo-sub { color: #64748b; font-size: 11px; font-weight: 500; }
        .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
        .nav-label { color: #475569; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 8px 8px 4px; }
        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 8px;
          text-decoration: none; color: #94a3b8;
          font-size: 14px; font-weight: 500;
          transition: all 0.15s ease;
        }
        .nav-link:hover { background: #1e293b; color: #e2e8f0; }
        .nav-link.active { background: #1d4ed8; color: #fff; }
        .nav-link.active svg { color: #93c5fd; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid #1e293b; }
        .back-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 8px;
          text-decoration: none; color: #64748b;
          font-size: 14px; font-weight: 500;
          transition: all 0.15s ease;
        }
        .back-link:hover { background: #1e293b; color: #94a3b8; }
        .main-content { flex: 1; overflow: auto; }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={18} color="#fff" /></div>
          <div>
            <div className="logo-text">Admin Portal</div>
            <div className="logo-sub">Everything Rental</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Main Menu</div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="back-link">
            <LogOut size={18} />
            Back to Site
          </Link>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}