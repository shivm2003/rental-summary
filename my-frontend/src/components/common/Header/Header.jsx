import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react'; // ✅ Added cart icon
import { APP_NAME } from '../../../utils/constants';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext'; // ✅ Added cart context
import './index.css';
import logo from "C:\Users\shivam\Desktop\EveryThing Rental\17 Feb - Copy\my-frontend\src\assets\Logo.png";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getCartCount } = useCart(); // ✅ Get cart count

  // Updated to hide search on the new list-product page
  const hideSearchRoutes = ['/login', '/register', '/list-item', '/list-product'];
  const hideSearch = hideSearchRoutes.includes(location.pathname);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    setSearch('');
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
              src={LogoImage} 
              alt="EveryThingRental Logo" 
              className="logo-img" 
              style={{ height: '48px', width: 'auto' }}
            />
          </Link>

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
            {/* ✅ REMOVED: <Link to="/dashboard">Dashboard</Link> */}
            {user?.lender && (
              <Link to="/lender/products">My Rentals</Link>
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
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

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
            <span className="material-symbols-outlined">close</span>
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

          {!hideSearch && (
            <form className="mobile-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">
                <span className="material-symbols-outlined">search</span>
              </button>
            </form>
          )}

          <nav className="mobile-nav">
            <Link to="/categories" onClick={() => setOpen(false)}>
              <span className="material-symbols-outlined"></span>
              Categories
            </Link>
            {/* ✅ REMOVED: Dashboard link from mobile menu */}
            {user?.lender && (
              <Link to="/lender/products" onClick={() => setOpen(false)}>
                <span className="material-symbols-outlined"></span>
                My Rentals
              </Link>
            )}

            {user ? (
              <>
                {user.lender ? (
                  <Link to="/list-product" onClick={() => setOpen(false)} className="btn-lender mobile-cta">
                    <span className="material-symbols-outlined"></span>
                    List a Product
                  </Link>
                ) : (
                  <Link to="/list-item" onClick={() => setOpen(false)} className="btn-lender mobile-cta">
                    <span className="material-symbols-outlined">store</span>
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
                  <span className="material-symbols-outlined">logout</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="mobile-login">
                  <span className="material-symbols-outlined">login</span>
                  Login
                </Link>
                <Link to="/list-item" onClick={() => setOpen(false)} className="btn-lender mobile-cta">
                  <span className="material-symbols-outlined">store</span>
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
