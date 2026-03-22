import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleRouter() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;

  // Simple logic: Admin goes to admin, everyone else goes home
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // User, Lender, or Both → normal home page
  return <Navigate to="/" replace />;
}