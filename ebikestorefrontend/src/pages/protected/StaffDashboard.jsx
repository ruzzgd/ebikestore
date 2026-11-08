import React from 'react';
import { Store, UserCheck, CarFront } from 'lucide-react';
import { Link } from 'react-router-dom';
import OperationalWarnings from '../../components/OperationalWarnings.jsx';
import reportService from '../../services/reportService.js';
import { useAuth } from '../../hooks/useAuth.js';

export function StaffDashboard() {
  const { user } = useAuth();
  const [overviewStats, setOverviewStats] = React.useState(null);

  React.useEffect(() => {
    reportService.getOverviewStats({ locationId: user?.location_id })
      .then(res => setOverviewStats(res.data))
      .catch(err => console.warn('Failed to fetch overview stats', err));
  }, [user]);

  return (
    <div><OperationalWarnings /><div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Store size={28} color="#3b82f6" />
        <h2>Branch Staff Dashboard</h2>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Welcome, <strong>{user?.name}</strong> ({user?.email}) &bull; Role: <span className="tech-tag">branch_staff</span>
      </p>
      <div className="dashboard-hero" style={{ fontSize: '0.9rem' }}>
        <p style={{ marginBottom: '1rem' }}>Manage stock and movement history for your assigned branch: <strong>{user?.location_name || 'location not assigned'}</strong>.</p>
        <div className="dashboard-actions">
          <Link to="/admin/products" className="btn-refresh"><CarFront size={15} /> Manage / Create Products</Link>
          <Link to="/inventory" className="btn-refresh primary">Open Branch Inventory</Link>
          <Link to="/transfers" className="btn-refresh">Transfer Requests</Link>
          <Link to="/manage/applications" className="btn-refresh">Customer Applications</Link>
          <Link to="/reports" className="btn-refresh">Reports</Link>
        </div>
      </div>
      
      {overviewStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Branch Inventory</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{overviewStats.totalInventoryUnits}</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Low Stock Items</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-status-error)' }}>{overviewStats.lowStockCount}</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Completed Transactions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{overviewStats.completedTransactions}</div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Pending Applications</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-status-warning)' }}>{overviewStats.applicationsAwaitingReview}</div>
          </div>
        </div>
      )}
    </div></div>
  );
}

export default StaffDashboard;
