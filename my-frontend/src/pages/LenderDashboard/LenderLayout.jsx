import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, PlusCircle, ShoppingBag, 
  Wrench, DollarSign, BarChart3, Bell, Settings, HelpCircle, LogOut, MessageSquare, Ticket, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import './LenderLayout.scss';

export default function LenderLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { to: '/lender/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/lender/products', icon: <Package size={20} />, label: 'My Products' },
    { to: '/lender/products/add', icon: <PlusCircle size={20} />, label: 'Add Product' },
    { to: '/lender/orders', icon: <ShoppingBag size={20} />, label: 'Rental Orders' },
    { to: '/lender/maintenance', icon: <Wrench size={20} />, label: 'Maintenance' },
    { to: '/lender/earnings', icon: <DollarSign size={20} />, label: 'Earnings' },
    { to: '/lender/coupons', icon: <Ticket size={20} />, label: 'Coupons' },
    { to: '/chat', icon: <MessageSquare size={20} />, label: 'Messages' },
    { to: '/lender/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { to: '/lender/notifications', icon: <Bell size={20} />, label: 'Notifications' },
  ];

  const bottomNavItems = [
    { to: '/lender/settings', icon: <Settings size={20} />, label: 'Settings' },
    { to: '/lender/support', icon: <HelpCircle size={20} />, label: 'Support' },
  ];

  return (
    <div className="lender-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <Link to="/" className="logo">EveryThingRental</Link>
        <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/">
            <h2>EveryThingRental</h2>
            <span className="subtitle">LENDER SUITE</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink 
                  to={item.to} 
                  className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <ul className="nav-list secondary">
            {bottomNavItems.map((item) => (
              <li key={item.to}>
                <NavLink 
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <button className="nav-item logout-btn" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Log Out</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="search-bar">
            <input type="text" placeholder="Search assets, orders, or transactions..." />
          </div>
          <div className="user-controls">
            <button className="icon-btn"><HelpCircle size={20} /></button>
            <Link to="/lender/notifications" className="icon-btn notification-btn">
              <Bell size={20} />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </Link>
            <div className="user-profile">
              <div className="details">
                <span className="name">{user?.first_name} {user?.last_name || user?.username}</span>
                <span className="role">Premium Lender</span>
              </div>
              <div className="avatar">
                {user?.first_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
