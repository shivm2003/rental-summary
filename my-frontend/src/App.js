// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/* ---------- Public Pages ---------- */
import Home from './pages/Home/index.jsx';
import Login from './pages/Login/index.jsx';
import Register from './pages/Register/index.jsx';
import ProductDetail from './pages/ProductDetail/index.jsx';

/* ---------- Admin Pages ---------- */
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import AdminCategories from './pages/Admin/Categories.jsx';
import HeroManagement from './pages/Admin/HeroManagement.jsx';
import HomepageCategories from './pages/Admin/HomepageCategories.jsx'; // NEW

/* ---------- Lender Pages ---------- */
import Lender from './pages/Lender/index.jsx';
import ListProduct from './pages/ListProduct/index.jsx';

/* ---------- Common ---------- */
import Header from './components/common/Header/Header.jsx';

// Debug wrapper component
const DebugWrapper = ({ children, name }) => {
  useEffect(() => {
    console.log(`✅ ${name} rendered`);
  }, [name]);
  
  return children;
};

/* ---------- Layout for Users/Lenders (With Header) ---------- */
const UserLayout = () => {
  console.log('🏗️ UserLayout rendering');
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

/* ---------- Route Guards ---------- */
const AdminRoute = () => {
  const { user, loading, isAdmin } = useAuth();
  
  console.log('🔒 AdminRoute check:', { loading, hasUser: !!user, role: user?.role });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading admin...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  if (!user) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin()) {
    console.log('❌ Not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  console.log('✅ Admin access granted');
  return <AdminLayout />;
};

const LenderRoute = () => {
  const { user, loading } = useAuth();
  
  console.log('🔒 LenderRoute check:', { loading, hasUser: !!user, isLender: user?.lender });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (!user.lender) return <Navigate to="/list-item" replace />;
  
  return <Outlet />;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('🔒 AuthRoute check:', { loading, hasUser: !!user });

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  if (user) {
    console.log('User already logged in, redirecting');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  console.log('🚀 App component rendering');

  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <DebugWrapper name="LoginRoute">
            <AuthRoute><Login /></AuthRoute>
          </DebugWrapper>
        } />
        <Route path="/register" element={
          <DebugWrapper name="RegisterRoute">
            <AuthRoute><Register /></AuthRoute>
          </DebugWrapper>
        } />
        
        {/* Main App Layout */}
        <Route element={<UserLayout />}>
          <Route path="/" element={
            <DebugWrapper name="Home">
              <Home />
            </DebugWrapper>
          } />
          <Route path="/product/:id" element={
            <DebugWrapper name="ProductDetail">
              <ProductDetail />
            </DebugWrapper>
          } />
          <Route path="/list-item" element={
            <DebugWrapper name="Lender">
              <Lender />
            </DebugWrapper>
          } />
          
          {/* Protected Lender Routes */}
          <Route element={<LenderRoute />}>
            <Route path="/list-product" element={
              <DebugWrapper name="ListProduct">
                <ListProduct />
              </DebugWrapper>
            } />
          </Route>
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <DebugWrapper name="AdminDashboard">
              <AdminDashboard />
            </DebugWrapper>
          } />
          <Route path="categories" element={
            <DebugWrapper name="AdminCategories">
              <AdminCategories />
            </DebugWrapper>
          } />
          <Route path="homepage-categories" element={
            <DebugWrapper name="HomepageCategories">
              <HomepageCategories />
            </DebugWrapper>
          } />
          <Route path="hero" element={
            <DebugWrapper name="HeroManagement">
              <HeroManagement />
            </DebugWrapper>
          } />
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
    </AuthProvider>
  );
}

export default App;