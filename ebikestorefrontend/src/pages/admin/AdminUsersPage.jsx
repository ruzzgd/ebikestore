import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, UserCheck, Users, UserX } from 'lucide-react';
import authService from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';
import SensitiveActionConfirmModal from '../../components/SensitiveActionConfirmModal.jsx';

const avatarUrl = (key) => key ? `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/uploads/images/${key}` : null;

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [action, setAction] = useState(null);
  const [message, setMessage] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { authService.listUsers().then((result) => setUsers(result || [])).catch((error) => setMessage({ type: 'error', text: error.message })).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => users.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${item.name} ${item.email} ${item.location_name || ''}`.toLowerCase().includes(term);
    return matchesSearch && (role === 'all' || item.role === role) && (status === 'all' || (status === 'active') === Boolean(item.is_active));
  }), [users, search, role, status]);

  const confirm = async (password) => {
    if (!action) return; setUpdating(true); setMessage(null);
    try { const updated = await authService.updateUserActive(action.id, !action.is_active, password); setUsers((items) => items.map((item) => item.id === updated.id ? updated : item)); setMessage({ type: 'success', text: `${updated.name} is now ${updated.is_active ? 'active' : 'deactivated'}.` }); setAction(null); }
    catch (error) { setMessage({ type: 'error', text: error.message }); } finally { setUpdating(false); }
  };

  return <div className="user-management-page">
    <header className="management-heading"><div><span className="section-eyebrow">ADMINISTRATION</span><h1>User Management</h1><p>Search accounts, review access assignments, and control account availability.</p></div><div className="management-count"><Users size={19} /><span><strong>{users.length}</strong><small>Total accounts</small></span></div></header>
    {message && <div className={`profile-notice ${message.type}`}>{message.text}</div>}
    <section className="user-management-card">
      <div className="user-management-toolbar"><label className="user-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or location…" /></label><select value={role} onChange={(event) => setRole(event.target.value)}><option value="all">All roles</option><option value="admin">Administrators</option><option value="branch_staff">Branch staff</option><option value="warehouse_staff">Warehouse staff</option><option value="customer">Customers</option></select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      <div className="user-results-summary">Showing <strong>{filtered.length}</strong> of {users.length} accounts</div>
      {loading ? <div className="management-empty">Loading user accounts…</div> : filtered.length === 0 ? <div className="management-empty">No accounts match these filters.</div> : <div className="user-management-table-wrap"><table className="user-management-table"><thead><tr><th>User</th><th>Role</th><th>Location</th><th>Status</th><th>Access</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className={item.is_active ? '' : 'inactive'}><td><div className="management-user"><span>{item.avatar_key ? <img src={avatarUrl(item.avatar_key)} alt="" /> : item.name?.[0]?.toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.email}</small></div></div></td><td><span className="management-role">{item.role.replaceAll('_', ' ')}</span></td><td>{item.location_name || 'Not assigned'}</td><td><span className={`user-status-pill ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td><td><button className={`account-access-button ${item.is_active ? 'deactivate' : 'activate'}`} disabled={item.id === user?.id || updating} onClick={() => setAction(item)}>{item.is_active ? <UserX size={15} /> : <UserCheck size={15} />}{item.id === user?.id ? 'Current user' : item.is_active ? 'Deactivate' : 'Reactivate'}</button></td></tr>)}</tbody></table></div>}
    </section>
    <SensitiveActionConfirmModal isOpen={Boolean(action)} onClose={() => setAction(null)} onConfirm={confirm} title={action?.is_active ? 'Deactivate account' : 'Reactivate account'} message={`Enter your administrator password to ${action?.is_active ? 'deactivate' : 'reactivate'} ${action?.name || 'this account'}.`} />
  </div>;
}

export default AdminUsersPage;
