// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SocketProvider } from './contexts/SocketContext';
import { LocationProvider } from './contexts/LocationContext';
import { Toaster } from 'react-hot-toast';
import { subscribeToPushNotifications } from './utils/push-notifications';

/* ---------- Public Pages ---------- */
import Home from './pages/Home/index.jsx';
import Login from './pages/Login/index.jsx';
import Register from './pages/Register/index.jsx';
import ForgotPassword from './pages/ForgotPassword/index.jsx';
import ProductDetail from './pages/ProductDetail/index.jsx';

/* ---------- Cart Page ---------- */
import CartPage from './pages/Cart/CartPage.jsx';
import CheckoutPage from './pages/Checkout/CheckoutPage';

/* ---------- Admin Pages ---------- */
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import AdminCategories from './pages/Admin/Admincategories.jsx';
import AdminHeroBanners from './pages/Admin/Adminherobanners.jsx';
import AdminQueries from './pages/Admin/AdminQueries.jsx';
import AdminApprovals from './pages/Admin/AdminApprovals.jsx';
import AdminCityProducts from './pages/Admin/AdminCityProducts.jsx';
import AdminNotifications from './pages/Admin/AdminNotifications.jsx';

/* ---------- Lender Pages ---------- */
import Lender from './pages/Lender/index.jsx';
import ListProduct from './pages/ListProduct/index.jsx';
import LenderLayout from './pages/LenderDashboard/LenderLayout.jsx';
import DashboardOverview from './pages/LenderDashboard/DashboardOverview.jsx';
import AssetInventory from './pages/LenderDashboard/AssetInventory.jsx';
import EditProduct    from './pages/LenderDashboard/EditProduct.jsx';
import RentalOrders from './pages/LenderDashboard/RentalOrders.jsx';
import Maintenance from './pages/LenderDashboard/Maintenance.jsx';
import Earnings from './pages/LenderDashboard/Earnings.jsx';
import Analytics from './pages/LenderDashboard/Analytics.jsx';
import Notifications from './pages/LenderDashboard/Notifications.jsx';
import LenderCoupons from './pages/LenderDashboard/LenderCoupons.jsx';

/* ---------- Common ---------- */
import Header from './components/common/Header/Header.jsx';

import CategoryPage from './pages/CategoryPage/index.jsx';
import AllCategories from './pages/AllCategories/index.jsx';
import About from './pages/About/index.jsx';
import Careers from './pages/Careers/index.jsx';
import FAQ from './pages/FAQ/index.jsx';
import Terms from './pages/Terms/index.jsx';
import Contact from './pages/Contact/index.jsx';
import Orders from './pages/Orders/index.jsx';
import OrderDetails from './pages/Orders/OrderDetails.jsx';
import Chat from './pages/Chat/index.jsx';
import Profile from './pages/Profile/index.jsx';

/* ---------- Layout for Users/Lenders (With Header) ---------- */
const UserLayout = () => {
  useEffect(() => {
    // Prompt for push notifications on mount
    subscribeToPushNotifications();
  }, []);

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

/* ---------- Route Guards ---------- */

// Admin-only route guard
const AdminRoute = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Loading...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;

  return <AdminLayout />;
};

// Lender-only route guard
const LenderRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.lender) return <Navigate to="/list-item" replace />;

  return <LenderLayout />;
};

// Auth route - redirect to home if already logged in
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (user) return <Navigate to="/" replace />;
  return children;
};
// General protected route - redirect to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <LocationProvider>
        <CartProvider>
          <Toaster position="top-center" />
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />

          {/* Main App Layout - Always shows Home first */}
          <Route element={<UserLayout />}>
            {/* ✅ NEW: Support both /category/:slug and /?cat= formats */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<Home />} />
            <Route path="/categories" element={<AllCategories />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/list-item" element={<ProtectedRoute><Lender /></ProtectedRoute>} />
          </Route>

          {/* Protected Lender Routes (Dedicated Layout) */}
          <Route path="/lender" element={<LenderRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="products" element={<AssetInventory />} />
            <Route path="products/add" element={<ListProduct />} />
            <Route path="products/edit/:id" element={<EditProduct />} />
            <Route path="orders" element={<RentalOrders />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="coupons" element={<LenderCoupons />} />
          </Route>

          <Route element={<LenderRoute />}>
            <Route path="/list-product" element={<Navigate to="/lender/products/add" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="hero" element={<AdminHeroBanners />} />
            <Route path="queries" element={<AdminQueries />} />
            <Route path="city-products" element={<AdminCityProducts />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#f5f5f5',
              fontFamily: 'system-ui, sans-serif'
            }}>
              <Helmet>
                <title>Page Not Found | EverythingRental</title>
                <meta name="robots" content="noindex" />
              </Helmet>
              <h1 style={{ fontSize: '6rem', margin: '0', color: '#e0e0e0' }}>404</h1>
              <h2 style={{ color: '#666', marginBottom: '2rem' }}>Page Not Found</h2>
              <a href="/" style={{
                padding: '0.75rem 1.5rem',
                background: '#1193d4',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                Go Home
              </a>
            </div>
          } />
        </Routes>
        </CartProvider>
        </LocationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;