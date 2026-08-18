import React, { useState, useEffect } from 'react';
import { Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../services/apiClient.js';

export default function AuthAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    eventType: '',
    email: '',
    page: 1,
    limit: 20
  });
  
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [filters.page, filters.eventType]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filters.eventType) queryParams.append('eventType', filters.eventType);
      if (filters.email) queryParams.append('email', filters.email);
      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);
      
      const response = await apiClient(`/auth/audit-logs?${queryParams.toString()}`);
      if (response.data) {
        setLogs(response.data.logs || []);
        setTotal(response.data.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchLogs();
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={28} style={{ color: 'var(--color-brand-primary)' }} />
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
              Authentication Audit Logs
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Security review of login and logout events
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Search Email</label>
            <input 
              type="text" 
              placeholder="user@example.com"
              value={filters.email}
              onChange={(e) => setFilters({...filters, email: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Event Type</label>
            <select 
              value={filters.eventType}
              onChange={(e) => setFilters({...filters, eventType: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
            >
              <option value="">All Events</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <button type="submit" className="btn primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} /> Filter
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-border)' }}>Timestamp</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-border)' }}>Event</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-border)' }}>Email Attempted</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-border)' }}>IP Address</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No audit logs found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>
                    {log.event_type.replace('_', ' ').toUpperCase()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {log.email_attempted || log.user_email || 'N/A'}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    {log.ip_address}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {log.success ? (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>SUCCESS</span>
                    ) : (
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>FAILED</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {!loading && totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, total)} of {total} entries
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handlePageChange(filters.page - 1)} 
                disabled={filters.page === 1}
                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-bg-main)', cursor: filters.page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => handlePageChange(filters.page + 1)} 
                disabled={filters.page >= totalPages}
                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-bg-main)', cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
