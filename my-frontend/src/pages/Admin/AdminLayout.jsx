import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, FolderOpen, Image as ImageIcon, LogOut, Zap, MessageSquare, MapPin, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, setUnreadCount, setNotifications } = useSocket();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        const token = localStorage.getItem('token');
        await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/notifications/${notif.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      }

      // Redirect based on type
      if (notif.type === 'PENDING_LENDER' || notif.type === 'PENDING_LISTING') {
        navigate('/admin/approvals');
      } else if (notif.type === 'NEW_QUERY') {
        navigate('/admin/queries');
      }
      setShowNotifications(false);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { path: '/admin/approvals', icon: FolderOpen, label: 'Pending Approvals' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categories' },
    { path: '/admin/hero', icon: ImageIcon, label: 'Hero Banners' },
    { path: '/admin/queries', icon: MessageSquare, label: 'Customer Queries' },
    { path: '/admin/city-products', icon: MapPin, label: 'Products by City' },
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
        .main-content { flex: 1; overflow: auto; display: flex; flex-direction: column; }
        .admin-header {
          height: 64px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .notification-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .notification-btn:hover { background: #f1f5f9; color: #1e293b; }
        .badge {
          position: absolute;
          top: 4px; right: 4px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          min-width: 16px; height: 16px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff;
        }
        .notif-dropdown {
          position: absolute;
          top: 56px; right: 32px;
          width: 320px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notif-header {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .notif-title { font-weight: 600; color: #1e293b; font-size: 14px; }
        .mark-read { font-size: 12px; color: #3b82f6; cursor: pointer; border: none; background: none; font-weight: 500; }
        .notif-list { max-height: 400px; overflow-y: auto; }
        .notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f8fafc;
          cursor: pointer;
          transition: background 0.2s;
          display: flex; gap: 12px;
        }
        .notif-item:hover { background: #f8fafc; }
        .notif-item.unread { background: #f0f7ff; }
        .notif-item.unread:hover { background: #e0efff; }
        .notif-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .notif-content { flex: 1; }
        .notif-msg-title { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 2px; }
        .notif-msg { font-size: 12px; color: #64748b; line-height: 1.4; }
        .notif-time { font-size: 10px; color: #94a3b8; margin-top: 4px; }
        .empty-notif { padding: 32px 16px; text-align: center; color: #94a3b8; font-size: 13px; }
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
        <header className="admin-header">
          <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unreadCount > 0 && <button className="mark-read" onClick={markAllAsRead}>Mark all as read</button>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="empty-notif">No notifications yet</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notif-icon" style={{ 
                        background: notif.type.includes('PENDING') ? '#fff7ed' : '#f0f9ff',
                        color: notif.type.includes('PENDING') ? '#f97316' : '#0ea5e9'
                      }}>
                        {notif.type.includes('LENDER') ? <FolderOpen size={16} /> : 
                         notif.type.includes('LISTING') ? <Zap size={16} /> : 
                         <MessageSquare size={16} />}
                      </div>
                      <div className="notif-content">
                        <div className="notif-msg-title">{notif.title}</div>
                        <div className="notif-msg">{notif.message}</div>
                        <div className="notif-time">
                          {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </header>
        <div style={{ padding: '32px', flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}