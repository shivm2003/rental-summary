import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Restore user from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('🔄 AuthContext init:', { hasToken: !!token, hasUser: !!storedUser });
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          if (parsedUser?.role) {
            setUser(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('✅ Auth restored:', parsedUser.role);
          } else {
            console.error('❌ No role in stored user, clearing...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('❌ Auth restore error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Handle navigation after auth state changes
  useEffect(() => {
    if (!isInitialized || loading) return;
    
    const currentPath = location.pathname;
    console.log('🧭 Navigation check:', { currentPath, userRole: user?.role });
    
    if (user && (currentPath === '/login' || currentPath === '/register')) {
      console.log('🎯 Redirecting from auth page to home');
      navigate('/', { replace: true });
    }
  }, [isInitialized, loading, user, location.pathname, navigate]);

  // ✅ FIXED: Login handler accepts (userData, token) - matches Login.jsx call
  const login = useCallback((userData, token) => {
    console.log('🔐 AuthContext.login() called:', { 
      role: userData?.role, 
      hasToken: !!token 
    });

    if (!userData?.role) {
      console.error('❌ FATAL: No role in userData!', userData);
      throw new Error('Cannot login: missing role');
    }

    // Normalize user data - handle both camelCase and snake_case
    const normalizedUser = {
      id: userData.id || userData.uid,
      username: userData.username || userData.userName || null,
      firstName: userData.firstName || userData.first_name || '',
      lastName: userData.lastName || userData.last_name || '',
      role: userData.role,
      lender: userData.lender || false,
    };

    console.log('✅ Normalized user:', normalizedUser);

    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    
    // Set axios auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Update state
    setUser(normalizedUser);
    
    console.log('💾 User saved, role:', normalizedUser.role);

    // Navigation for admin - immediate for better UX
    if (normalizedUser.role === 'admin') {
      console.log('🧭 Admin detected, navigating to /admin/dashboard');
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 100);
    }

    return normalizedUser;
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Role checking helpers
  const isAdmin = useCallback(() => user?.role === 'admin', [user]);
  const isLender = useCallback(() => ['lender', 'both'].includes(user?.role), [user]);
  const isUser = useCallback(() => ['user', 'both'].includes(user?.role), [user]);
  const isBoth = useCallback(() => user?.role === 'both', [user]);

  const hasRole = useCallback((roles) => {
    if (!user?.role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading: loading || !isInitialized,
    login,
    logout,
    isAdmin,
    isLender,
    isUser,
    isBoth,
    hasRole,
    isAuthenticated: !!user
  }), [user, loading, isInitialized, login, logout, isAdmin, isLender, isUser, isBoth, hasRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};