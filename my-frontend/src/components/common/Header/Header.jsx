import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, LayoutGrid, Package, PlusSquare, Store, LogIn, LogOut, MessageSquare, Bell, User, MapPin, ChevronDown } from 'lucide-react';
import { APP_NAME } from '../../../utils/constants';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { useSocket } from '../../../contexts/SocketContext';
import { useLocationContext } from '../../../contexts/LocationContext';
import './index.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const { unreadCount } = useSocket();
  const { district, city, districts, showPicker, setShowPicker, setManualDistrict, requestLocation, loading: locationLoading } = useLocationContext();

  // Sync context showPicker → local modal state (triggered by Home page 'Change' button)
  React.useEffect(() => {
    if (showPicker) {
      setShowLocationModal(true);
      setShowPicker(false);
    }
  }, [showPicker, setShowPicker]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearch(q);
    }
  }, [location.search]);

  // Updated to hide search on the new list-product page
  const hideSearchRoutes = ['/login', '/register', '/list-item', '/list-product'];
  const hideSearch = hideSearchRoutes.includes(location.pathname);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    setOpen(false);
  };

  // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (!user) return '?';
    const name = user.firstName || user.username || 'User';
    return name.charAt(0).toUpperCase();
  };

  // ✅ Get cart item count
  const cartCount = getCartCount ? getCartCount() : 0;

  return (
    <>
      <header className="header-rentkart">
        <div className="container">
          {/* ---------- Product Logo ---------- */}
          <Link to="/" className="logo">
            <img
              src="/logo.png"
              alt="EveryThingRental Logo"
              className="logo-img"
              style={{ height: '48px', width: 'auto' }}
            />
          </Link>

          {/* ---------- Desktop Location Badge ---------- */}
          <button 
            className="header-location-badge"
            onClick={() => setShowLocationModal(true)}
            aria-label="Change location"
          >
            <MapPin size={14} />
            <span>{district || city || 'Select Location'}</span>
            <ChevronDown size={12} />
          </button>

          {/* ---------- Search Bar ---------- */}
          {!hideSearch && (
            <form className="header-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
              />
              <button type="submit" aria-label="Search">
                <span className="material-symbols-outlined">search</span>
              </button>
            </form>
          )}

          {/* ---------- Desktop Nav ---------- */}
          <nav className="desktop-nav">
            <Link to="/categories">Categories</Link>
            {user?.lender && (
              <Link to="/lender/products">My Rentals</Link>
            )}
            {user && (
              <>
                {/* Removed for cleaner UI */}
              </>
            )}
          </nav>

          <div className="desktop-actions">
            {/* ✅ ADDED: Cart Icon */}
            <Link
              to="/cart"
              className="cart-icon-wrapper"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>

            {user ? (
              <>
                <Link to="/chat" className="cart-icon-wrapper" aria-label="Messages">
                  <MessageSquare size={24} />
                </Link>
                <Link to="/lender/notifications" className="cart-icon-wrapper" aria-label="Notifications">
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="cart-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </Link>
                <span className="user-name">Hi, {user.firstName || user.username}</span>
                <button className="btn-logout" onClick={logout}>Logout</button>
                {/* Show "List a Product" for verified lenders */}
                {user.lender ? (
                  <Link to="/list-product" className="btn-lender">
                    List a Product
                  </Link>
                ) : (
                  <Link to="/list-item" className="btn-lender">
                    Become a Lender
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/list-item" className="btn-lender">Become a Lender</Link>
              </>
            )}

            {/* ---------- Enhanced Avatar with Tooltip ---------- */}
            <div
              className="avatar-wrapper"
              onClick={() => setOpen(true)}
              aria-label="Open user menu"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setOpen(true);
                }
              }}
            >
              <div className="avatar">
                {user?.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={`${user.firstName || user.username || 'User'}'s profile`}
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="avatar-fallback"
                  style={{ display: user?.profilePictureUrl ? 'none' : 'flex' }}
                >
                  {getUserInitials()}
                </div>
                {user && <span className="online-dot" />}
              </div>
              {user && (
                <div className="avatar-tooltip">
                  {user.firstName || user.username}
                </div>
              )}
            </div>
          </div>

          {/* ---------- Mobile Hamburger ---------- */}
          <button
            className="menu-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={26} color="var(--text-primary-light)" className="menu-btn-icon" />
          </button>
        </div>

        {/* ---------- Mobile Search Bar (Below Header) ---------- */}
        {!hideSearch && (
          <div className="mobile-search-bar-container">
            {/* Mobile Location Bar - between header and search */}
            <button 
              className="mobile-location-bar"
              onClick={() => setShowLocationModal(true)}
            >
              <MapPin size={14} />
              <span>Deliver to: <strong>{district || city || 'Select Location'}</strong></span>
              <ChevronDown size={14} />
            </button>
            <form className="header-search-mobile" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
              />
              <button type="submit" aria-label="Search">
                <span className="material-symbols-outlined">search</span>
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ---------- Location Picker Modal ---------- */}
      {showLocationModal && (
        <div className="location-modal-overlay" onClick={() => { setShowLocationModal(false); setLocationSearch(''); }}>
          <div className="location-modal" onClick={e => e.stopPropagation()}>
            <div className="location-modal-header">
              <h3><MapPin size={18}/> Choose Your City</h3>
              <button onClick={() => { setShowLocationModal(false); setLocationSearch(''); }}><X size={18}/></button>
            </div>
            <button 
              className="location-use-gps"
              onClick={() => { requestLocation(); setShowLocationModal(false); setLocationSearch(''); }}
              disabled={locationLoading}
            >
              <MapPin size={16}/>
              {locationLoading ? 'Detecting...' : 'Use My Current Location'}
            </button>
            <div className="location-divider">or search / select city</div>
            {/* Search Input */}
            <div className="location-search-wrap">
              <Search size={16} />
              <input
                className="location-search-input"
                type="text"
                placeholder="Search city..."
                value={locationSearch}
                onChange={e => setLocationSearch(e.target.value)}
                autoFocus
              />
              {locationSearch && (
                <button className="location-search-clear" onClick={() => setLocationSearch('')}>
                  <X size={14}/>
                </button>
              )}
            </div>
            <div className="location-districts-grid">
              {districts
                .filter(d => d.toLowerCase().includes(locationSearch.toLowerCase()))
                .map(d => (
                  <button
                    key={d}
                    className={`location-district-btn ${district === d ? 'active' : ''}`}
                    onClick={() => { setManualDistrict(d); setShowLocationModal(false); setLocationSearch(''); }}
                  >
                    {d}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Mobile Slide-In Menu ---------- */}
      <div
        className={`mobile-menu ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      >
        <div
          className="mobile-menu-content"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={26} color="var(--text-primary-light)" className="close-btn-icon" />
          </button>

          {/* ---------- Mobile User Profile Card ---------- */}
          {user && (
            <div className="mobile-user-card">
              <div className="mobile-avatar">
                {user.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={`${user.firstName || user.username || 'User'}'s profile`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="avatar-fallback"
                  style={{ display: user.profilePictureUrl ? 'none' : 'flex' }}
                >
                  {getUserInitials()}
                </div>
                <span className="online-dot" />
              </div>
              <div className="mobile-user-info">
                <span className="mobile-user-name">{user.firstName || user.username}</span>
                {user.email && <span className="mobile-user-email">{user.email}</span>}
              </div>
            </div>
          )}

          {/* ✅ ADDED: Mobile Cart Link */}
          <Link
            to="/cart"
            className="mobile-cart-link"
            onClick={() => setOpen(false)}
          >
            <ShoppingCart size={20} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="mobile-cart-badge">{cartCount}</span>
            )}
          </Link>

          <nav className="mobile-nav">
            <Link to="/categories" onClick={() => setOpen(false)}>
              <LayoutGrid size={20} />
              Categories
            </Link>
            {user?.lender && (
              <Link to="/lender/products" onClick={() => setOpen(false)}>
                <Package size={20} />
                My Rentals
              </Link>
            )}
            {user && (
              <>
                <Link to="/orders" onClick={() => setOpen(false)}>
                  <Package size={20} />
                  My Orders
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)}>
                  <User size={20} />
                  Profile
                </Link>
                <Link to="/chat" onClick={() => setOpen(false)}>
                  <MessageSquare size={20} />
                  Messages
                </Link>
                <Link to="/lender/notifications" onClick={() => setOpen(false)}>
                  <Bell size={20} />
                  Notifications
                  {unreadCount > 0 && <span className="mobile-cart-badge" style={{ position:'relative', top: 'auto', right: 'auto', marginLeft: 'auto' }}>{unreadCount}</span>}
                </Link>
              </>
            )}

            {user ? (
              <>
                {user.lender ? (
                  <Link to="/list-product" onClick={() => setOpen(false)} className="btn-lender mobile-cta">
                    <PlusSquare size={20} />
                    List a Product
                  </Link>
                ) : (
                  <Link to="/list-item" onClick={() => setOpen(false)} className="btn-lender mobile-cta">
                    <Store size={20} className="icon-mr" />
                    Become a Lender
                  </Link>
                )}
                <button
                  className="btn-logout mobile-logout"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  <LogOut size={20} className="icon-mr" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="mobile-login">
                  <LogIn size={20} className="icon-mr" />
                  Login
                </Link>
                <Link to="/list-item" onClick={() => setOpen(false)} className="btn-lender mobile-cta">
                  <Store size={20} className="icon-mr" />
                  Become a Lender
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
