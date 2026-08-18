import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { RefreshCw } from 'lucide-react';

const ROLE_REDIRECT_MAP = {
  admin: '/admin',
  branch_staff: '/staff',
  warehouse_staff: '/warehouse',
  customer: '/account',
};

export function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-light)' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const redirectPath = ROLE_REDIRECT_MAP[user.role] || '/account';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
