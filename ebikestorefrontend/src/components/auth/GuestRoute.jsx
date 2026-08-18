import React from 'react';
import { Navigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const ROLE_HOME = { admin: '/admin', branch_staff: '/staff', warehouse_staff: '/warehouse', customer: '/account' };

export function GuestRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="route-loading"><RefreshCw size={26} className="spin-icon" /></div>;
  if (isAuthenticated) return <Navigate to={ROLE_HOME[user?.role] || '/account'} replace />;
  return children;
}

export default GuestRoute;
