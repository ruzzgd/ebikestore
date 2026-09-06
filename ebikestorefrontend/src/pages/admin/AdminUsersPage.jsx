import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, UserCheck, Users, UserX, Trash2 } from 'lucide-react';
import authService from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';
import SensitiveActionConfirmModal from '../../components/SensitiveActionConfirmModal.jsx';
import Pagination from '../../components/Pagination.jsx';
import ErrorModal from '../../components/ErrorModal.jsx';

const avatarUrl = (key) => key ? `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/uploads/images/${key}` : null;

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [action, setAction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadUsers = () => {
    setLoading(true);
    authService.listUsers()
      .then((result) => setUsers(result || []))
      .catch((error) => setErrorMessage(error.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => users.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${item.name} ${item.email} ${item.location_name || ''}`.toLowerCase().includes(term);
    return matchesSearch && (role === 'all' || item.role === role) && (status === 'all' || (status === 'active') === Boolean(item.is_active));
  }), [users, search, role, status]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const confirmActiveToggle = async (password) => {
    if (!action) return;
    setUpdating(true);
    setMessage(null);
    try {
      const updated = await authService.updateUserActive(action.id, !action.is_active, password);
      setUsers((items) => items.map((item) => item.id === updated.id ? updated : item));
      setMessage({ type: 'success', text: `${updated.name} is now ${updated.is_active ? 'active' : 'deactivated'}.` });
      setAction(null);
    } catch (error) {
      setErrorMessage(error.message || 'Action failed');
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async (password) => {
    if (!deleteTarget) return;
    setUpdating(true);
    setMessage(null);
    try {
      await authService.deleteUser(deleteTarget.id, password);
      setUsers((items) => items.filter((item) => item.id !== deleteTarget.id));
      setMessage({ type: 'success', text: `Account for ${deleteTarget.name} was permanently removed.` });
      setDeleteTarget(null);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete user');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="user-management-page">
      <header className="management-heading">
        <div>
          <span className="section-eyebrow">ADMINISTRATION</span>
          <h1>User Management</h1>
          <p>Search accounts, review access assignments, and control account availability.</p>
        </div>
        <div className="management-count">
          <Users size={19} />
          <span><strong>{users.length}</strong><small>Total accounts</small></span>
        </div>
      </header>

      {message && <div className={`profile-notice ${message.type}`}>{message.text}</div>}

      <section className="user-management-card">
        <div className="user-management-toolbar">
          <label className="user-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search name, email, or location…"
            />
          </label>
          <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
            <option value="all">All roles</option>
            <option value="admin">Administrators</option>
            <option value="branch_staff">Branch staff</option>
            <option value="warehouse_staff">Warehouse staff</option>
            <option value="customer">Customers</option>
          </select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="user-results-summary">Showing <strong>{filtered.length}</strong> of {users.length} accounts</div>

        {loading ? (
          <div className="management-empty">Loading user accounts…</div>
        ) : filtered.length === 0 ? (
          <div className="management-empty">No accounts match these filters.</div>
        ) : (
          <>
            <div className="user-management-table-wrap">
              <table className="user-management-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Access Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => (
                    <tr key={item.id} className={item.is_active ? '' : 'inactive'}>
                      <td>
                        <div className="management-user">
                          <span>{item.avatar_key ? <img src={avatarUrl(item.avatar_key)} alt="" /> : item.name?.[0]?.toUpperCase()}</span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.email}</small>
                          </div>
                        </div>
                      </td>
                      <td><span className="management-role">{item.role.replaceAll('_', ' ')}</span></td>
                      <td>{item.location_name || 'Not assigned'}</td>
                      <td>
                        <span className={`user-status-pill ${item.is_active ? 'active' : 'inactive'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            className={`account-access-button ${item.is_active ? 'deactivate' : 'activate'}`}
                            disabled={item.id === user?.id || updating}
                            onClick={() => setAction(item)}
                          >
                            {item.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                            {item.id === user?.id ? 'Current user' : item.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>

                          {!item.is_active && item.id !== user?.id && (
                            <button
                              type="button"
                              className="btn-refresh reject"
                              style={{ padding: '0.35rem 0.65rem', minHeight: '32px', fontSize: '0.78rem' }}
                              onClick={() => setDeleteTarget(item)}
                              disabled={updating}
                              title={`Permanently delete ${item.name}`}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      {/* Toggle active modal */}
      <SensitiveActionConfirmModal
        isOpen={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={confirmActiveToggle}
        title={action?.is_active ? 'Deactivate account' : 'Reactivate account'}
        message={`Enter your administrator password to ${action?.is_active ? 'deactivate' : 'reactivate'} ${action?.name || 'this account'}.`}
      />

      {/* Delete confirmation modal */}
      <SensitiveActionConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Permanently Delete User (${deleteTarget?.name})`}
        message={`Warning: This will permanently delete the deactivated user account for ${deleteTarget?.name} (${deleteTarget?.email}). Enter your administrator password to confirm.`}
      />

      <ErrorModal
        isOpen={Boolean(errorMessage)}
        title="User Management"
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />
    </div>
  );
}

export default AdminUsersPage;
