import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserPlus, Users, Tag, CarFront, MapPin, Package, ArrowLeftRight, ClipboardCheck, BarChart, TrendingUp, AlertTriangle, CheckCircle2, Activity, UserCheck, UserX, Menu, X } from 'lucide-react';
import authService from '../../services/authService.js';
import locationService from '../../services/locationService.js';
import reportService from '../../services/reportService.js';
import { useAuth } from '../../hooks/useAuth.js';
import OperationalWarnings from '../../components/OperationalWarnings.jsx';
import SensitiveActionConfirmModal from '../../components/SensitiveActionConfirmModal.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import ErrorModal from '../../components/ErrorModal.jsx';

const safePercent = (value, total) => total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

function AdminCharts({ stats }) {
  const trackedInventory = Math.max(stats.activeProducts || 0, stats.lowStockCount + stats.outOfStockCount, 1);
  const outPercent = safePercent(stats.outOfStockCount, trackedInventory);
  const lowOnly = Math.max(0, stats.lowStockCount - stats.outOfStockCount);
  const lowPercent = safePercent(lowOnly, trackedInventory);
  const healthyPercent = Math.max(0, 100 - outPercent - lowPercent);
  const movementValues = [stats.stockInUnits, stats.stockOutUnits, stats.transferInUnits, stats.transferOutUnits];
  const movementMax = Math.max(...movementValues, 1);
  const workload = [
    { label: 'Applications awaiting review', value: stats.applicationsAwaitingReview, color: '#f59e0b' },
    { label: 'Active transfer requests', value: stats.activeTransfers, color: '#6366f1' },
    { label: 'Completed transactions', value: stats.completedTransactions, color: '#10b981' },
  ];
  const workloadMax = Math.max(...workload.map((item) => item.value), 1);

  return <section className="admin-analytics">
    <div className="section-heading"><div><span className="section-eyebrow">LAST 30 DAYS</span><h2>Operational analytics</h2><p>A quick visual check of stock condition, movement, and team workload.</p></div><Link to="/reports" className="btn-refresh"><BarChart size={16} />Full reports</Link></div>
    <div className="analytics-grid">
      <article className="analytics-card">
        <div className="analytics-card-title"><span><Activity size={18} />Inventory health</span><small>{stats.activeProducts} active products</small></div>
        <div className="donut-layout"><div className="donut-chart" style={{ background: `conic-gradient(#10b981 0 ${healthyPercent}%, #f59e0b ${healthyPercent}% ${healthyPercent + lowPercent}%, #ef4444 ${healthyPercent + lowPercent}% 100%)` }}><div><strong>{healthyPercent}%</strong><span>healthy</span></div></div>
          <div className="chart-legend"><span><i className="healthy" />Healthy <strong>{healthyPercent}%</strong></span><span><i className="low" />Low stock <strong>{lowOnly}</strong></span><span><i className="out" />Out of stock <strong>{stats.outOfStockCount}</strong></span></div></div>
      </article>
      <article className="analytics-card">
        <div className="analytics-card-title"><span><TrendingUp size={18} />Stock movement</span><small>Units processed</small></div>
        <div className="vertical-chart">{[
          ['Stock in', stats.stockInUnits, 'teal'], ['Stock out', stats.stockOutUnits, 'orange'], ['Transfer in', stats.transferInUnits, 'indigo'], ['Transfer out', stats.transferOutUnits, 'slate']
        ].map(([label, value, tone]) => <div className="vertical-bar-item" key={label}><strong>{value}</strong><div className="vertical-bar-track"><span className={tone} style={{ height: `${Math.max(value ? 10 : 2, (value / movementMax) * 100)}%` }} /></div><small>{label}</small></div>)}</div>
      </article>
      <article className="analytics-card">
        <div className="analytics-card-title"><span><ClipboardCheck size={18} />Workflow status</span><small>Current workload</small></div>
        <div className="horizontal-chart">{workload.map((item) => <div className="horizontal-bar-item" key={item.label}><div><span>{item.label}</span><strong>{item.value}</strong></div><div><span style={{ width: `${Math.max(item.value ? 8 : 1, (item.value / workloadMax) * 100)}%`, background: item.color }} /></div></div>)}</div>
      </article>
    </div>
  </section>;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'branch_staff',
    locationId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accountAction, setAccountAction] = useState(null);
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  const [overviewStats, setOverviewStats] = useState(null);

  const fetchUsersAndLocations = async () => {
    setLoadingUsers(true);
    try {
      const [usersData, locsData] = await Promise.all([
        authService.listUsers(),
        locationService.getLocations(),
      ]);
      setUsers(usersData || []);
      setLocations(locsData || []);

      // Pre-select first branch location by default
      const branchLocs = locsData.filter((l) => l.type === 'branch');
      if (branchLocs.length > 0) {
        setFormData((prev) => ({ ...prev, locationId: branchLocs[0].id }));
      }
    } catch (err) {
      console.warn('Failed to fetch data:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await reportService.getOverviewStats();
      setOverviewStats(res.data);
    } catch (err) {
      console.warn('Failed to fetch overview stats', err);
    }
  };

  useEffect(() => {
    fetchUsersAndLocations();
    fetchOverview();
  }, []);

  // Update selected location when role changes to match required location type
  const handleRoleChange = (newRole) => {
    const targetType = newRole === 'warehouse_staff' ? 'warehouse' : 'branch';
    const validLocs = locations.filter((l) => l.type === targetType);
    const newLocId = validLocs.length > 0 ? validLocs[0].id : '';

    setFormData({
      ...formData,
      role: newRole,
      locationId: newLocId,
    });
  };

  const filteredLocations = locations.filter((l) => {
    if (formData.role === 'warehouse_staff') return l.type === 'warehouse';
    if (formData.role === 'branch_staff') return l.type === 'branch';
    return true;
  });

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanName = formData.name.trim();
    if (/\d/.test(cleanName)) {
      setError('Staff name cannot contain numbers.');
      return;
    }
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s.'-]+$/;
    if (!nameRegex.test(cleanName) || !/[a-zA-ZÀ-ÿ\u00f1\u00d1]/.test(cleanName)) {
      setError('Staff name can only contain letters, spaces, hyphens, periods, and apostrophes. Numbers and special characters are not allowed.');
      return;
    }

    setSubmitting(true);

    try {
      const newStaff = await authService.createStaffAccount({ ...formData, name: cleanName });
      setSuccess(`Staff account '${newStaff.email}' (${newStaff.role}) assigned to ${newStaff.location_name} created successfully!`);
      const defaultBranchLoc = locations.find((l) => l.type === 'branch')?.id || '';
      setFormData({ name: '', email: '', password: '', role: 'branch_staff', locationId: defaultBranchLoc });
      fetchUsersAndLocations();
    } catch (err) {
      setError(err.message || 'Failed to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAccountAction = async (password) => {
    if (!accountAction) return;
    setUpdatingAccount(true); setError(''); setSuccess('');
    try {
      const updated = await authService.updateUserActive(accountAction.id, !accountAction.is_active, password);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSuccess(`${updated.name}'s account is now ${updated.is_active ? 'active' : 'deactivated'}.`);
      setAccountAction(null);
    } catch (err) { setError(err.message || 'Unable to update account access.'); }
    finally { setUpdatingAccount(false); }
  };

  return (
    <div>
      <OperationalWarnings />
      <div className="admin-welcome-card">
        <div className="admin-welcome-heading">
          <div className="admin-welcome-title"><span className="admin-welcome-icon"><ShieldCheck size={25} /></span><div><span className="section-eyebrow">ADMIN WORKSPACE</span><h1>Administrator Control Center</h1></div></div>
          <button type="button" className="admin-menu-trigger" aria-expanded={adminMenuOpen} aria-controls="admin-quick-menu" onClick={() => setAdminMenuOpen((open) => !open)}>{adminMenuOpen ? <X size={19} /> : <Menu size={19} />}<span>Admin Menu</span></button>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
          Logged in as <strong>{user?.name}</strong> ({user?.email}) &bull; Role: <span className="tech-tag" style={{ background: 'rgba(37,99,235,0.2)', color: '#60a5fa' }}>ADMIN</span>
        </p>

        <div id="admin-quick-menu" className={`admin-quick-menu ${adminMenuOpen ? 'open' : ''}`}>
          <Link to="/admin/products" className="btn-refresh primary" id="link-admin-products">
            <CarFront size={16} />
            <span>Manage Products</span>
          </Link>
          <Link to="/admin/categories" className="btn-refresh" id="link-admin-categories">
            <Tag size={16} />
            <span>Manage Categories</span>
          </Link>
          <Link to="/admin/locations" className="btn-refresh" id="link-admin-locations">
            <MapPin size={16} />
            <span>View Locations</span>
          </Link>
          <Link to="/inventory" className="btn-refresh" id="link-admin-inventory">
            <Package size={16} />
            <span>Manage Inventory</span>
          </Link>
          <Link to="/transfers" className="btn-refresh" id="link-admin-transfers">
            <ArrowLeftRight size={16} />
            <span>Transfer Requests</span>
          </Link>
          <Link to="/manage/applications" className="btn-refresh" id="link-admin-applications"><ClipboardCheck size={16} /><span>Customer Applications</span></Link>
          <Link to="/reports" className="btn-refresh" id="link-admin-reports"><BarChart size={16} /><span>Reports & Analytics</span></Link>
          <Link to="/admin/audit-logs" className="btn-refresh" id="link-admin-audit-logs"><ShieldCheck size={16} /><span>Auth Audit Logs</span></Link>
        </div>
      </div>

      {overviewStats && <><div className="admin-stat-grid">
        {[[Package, 'Total inventory', overviewStats.totalInventoryUnits, 'Units across all locations', 'teal'], [CarFront, 'Active products', overviewStats.activeProducts, 'Available catalog entries', 'blue'], [AlertTriangle, 'Low stock', overviewStats.lowStockCount, `${overviewStats.outOfStockCount} currently out of stock`, 'amber'], [CheckCircle2, 'Completed', overviewStats.completedTransactions, 'Transactions in last 30 days', 'green']].map(([Icon, label, value, hint, tone]) => <article className={`admin-stat-card ${tone}`} key={label}><span><Icon size={19} /></span><div><small>{label}</small><strong>{value}</strong><p>{hint}</p></div></article>)}
      </div><AdminCharts stats={overviewStats} /></>}

      <div className="grid-cols-2">
        {/* Create Staff Account Form */}
        <div className="card dashboard-form-card">
          <div className="dashboard-form-card-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <UserPlus size={22} color="#3b82f6" />
            <h3>Provision Staff Account</h3>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.65rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: '#991b1b', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.65rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: '#166534', fontSize: '0.85rem' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleStaffSubmit} id="form-create-staff">
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                Staff Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Staff Member Name (Letters only)"
                style={{ width: '100%', padding: '0.55rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                id="input-staff-name"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@fideloe-bikes.com"
                style={{ width: '100%', padding: '0.55rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                id="input-staff-email"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                Initial Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <PasswordInput
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Temporary password"
                inputStyle={{ width: '100%', padding: '0.55rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                id="input-staff-password"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                Assign Staff Role <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                id="select-staff-role"
              >
                <option value="branch_staff">Branch Staff</option>
                <option value="warehouse_staff">Warehouse Staff</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                Assign Operating Location <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                id="select-staff-location"
              >
                {filteredLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-refresh primary"
              style={{ width: '100%', justifyContent: 'center' }}
              id="btn-create-staff-submit"
            >
              <span>{submitting ? 'Creating Staff Account...' : 'Create Staff Account'}</span>
            </button>
          </form>
        </div>

        {/* System User Directory */}
        <div className="card">
          <Link to="/admin/users" className="directory-card-heading">
            <Users size={22} color="#0d9488" />
            <div><h3>User Directory</h3><small>Open full user management →</small></div>
          </Link>

          {loadingUsers ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Loading user directory...</p>
          ) : (
            <div className="admin-user-list">
              {users.map((u) => (
                <div key={u.id} className={`admin-user-row ${u.is_active ? '' : 'inactive'}`}>
                  <span className="admin-user-avatar">{u.avatar_key ? <img src={`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/uploads/images/${u.avatar_key}`} alt="" /> : u.name?.slice(0, 1).toUpperCase()}</span>
                  <div className="admin-user-details">
                    <div style={{ fontWeight: '600' }}>{u.name}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      {u.email} {u.location_name ? `&bull; ${u.location_name}` : ''}
                    </div>
                  </div>
                  <div className="admin-user-state">
                    <span className="tech-tag">{u.role.replaceAll('_', ' ')}</span>
                    <span className={`user-status ${u.is_active ? 'active' : 'inactive'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <button className={`account-access-button ${u.is_active ? 'deactivate' : 'activate'}`} disabled={u.id === user?.id || updatingAccount} onClick={() => setAccountAction(u)} title={u.id === user?.id ? 'You cannot deactivate your own account' : undefined}>{u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}{u.is_active ? 'Deactivate' : 'Reactivate'}</button>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/users" className="btn secondary directory-view-all"><Users size={15} />View all users</Link>
        </div>
      </div>
      <SensitiveActionConfirmModal isOpen={Boolean(accountAction)} onClose={() => setAccountAction(null)} onConfirm={confirmAccountAction} title={accountAction?.is_active ? 'Deactivate account' : 'Reactivate account'} message={`Enter your administrator password to ${accountAction?.is_active ? 'deactivate' : 'reactivate'} ${accountAction?.name || 'this user'}.`} />
    </div>
  );
}

export default AdminDashboard;
