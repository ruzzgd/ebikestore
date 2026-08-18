import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Bike, Boxes, ClipboardCheck, LayoutDashboard, LogOut, Package, UserRound, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import NotificationBell from './NotificationBell.jsx';

const ROLE_HOME = { admin: '/admin', branch_staff: '/staff', warehouse_staff: '/warehouse', customer: '/account' };

const NAV_ITEMS = {
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/transfers', label: 'Transfers', icon: Package },
    { to: '/manage/applications', label: 'Applications', icon: ClipboardCheck },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  branch_staff: [
    { to: '/staff', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/transfers', label: 'Transfers', icon: Package },
    { to: '/manage/applications', label: 'Applications', icon: ClipboardCheck },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  warehouse_staff: [
    { to: '/warehouse', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/transfers', label: 'Transfers', icon: Package },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  customer: [
    { to: '/account', label: 'My Account', icon: LayoutDashboard, end: true },
    { to: '/account/applications', label: 'Applications', icon: ClipboardCheck },
    { to: '/products', label: 'Browse E-Bikes', icon: Bike },
  ],
};

const roleLabel = (role) => ({ admin: 'Administrator', branch_staff: 'Branch Staff', warehouse_staff: 'Warehouse Staff', customer: 'Customer' }[role] || 'Account');
const avatarUrl = (key) => key ? `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/uploads/images/${key}` : null;

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const home = ROLE_HOME[user?.role] || '/account';
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.customer;
  const initials = user?.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';

  const signOut = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-primary">
        <div className="dashboard-header-inner">
          <Link to={home} className="dashboard-brand" aria-label="Fidelo Inventory Workspace"><img src="/images/fidelo-header-logo.png" alt="Fidelo E-Bike" /><small>Inventory Workspace</small></Link>
          <div className="dashboard-user-actions">
            <NotificationBell />
            <Link to="/profile" className="dashboard-user"><span className="dashboard-avatar">{user?.avatar_key ? <img src={avatarUrl(user.avatar_key)} alt="" /> : initials}</span><span className="dashboard-user-copy"><strong>{user?.name}</strong><small>{roleLabel(user?.role)}{user?.location_name ? ` · ${user.location_name}` : ''}</small></span></Link>
            <button className="dashboard-logout" onClick={signOut} title="Sign out"><LogOut size={18} /><span>Sign out</span></button>
          </div>
        </div>
      </div>
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <div className="dashboard-nav-inner">
          {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}><Icon size={16} /><span>{label}</span></NavLink>)}
          <NavLink to="/profile" className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}><UserRound size={16} /><span>Profile</span></NavLink>
          {user?.role === 'admin' && <NavLink to="/admin/users" className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}><Users size={16} /><span>User Management</span></NavLink>}
        </div>
      </nav>
    </header>
  );
}

export default DashboardHeader;
