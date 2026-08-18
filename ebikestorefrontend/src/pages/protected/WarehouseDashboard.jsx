import React from 'react';
import { Warehouse, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import OperationalWarnings from '../../components/OperationalWarnings.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export function WarehouseDashboard() {
  const { user } = useAuth();

  return (
    <div><OperationalWarnings /><div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Warehouse size={28} color="#0d9488" />
        <h2>Warehouse Staff Portal</h2>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Welcome, <strong>{user?.name}</strong> ({user?.email}) &bull; Role: <span className="tech-tag">warehouse_staff</span>
      </p>
      <div className="dashboard-hero" style={{ fontSize: '0.9rem' }}>
        <p style={{ marginBottom: '1rem' }}>Manage stock and movement history for your assigned warehouse: <strong>{user?.location_name || 'location not assigned'}</strong>.</p>
        <div className="dashboard-actions"><Link to="/inventory" className="btn-refresh primary"><Package size={15} /> Open Warehouse Inventory</Link>
        <Link to="/transfers" className="btn-refresh">Transfer Requests</Link>
        <Link to="/reports" className="btn-refresh">Reports</Link></div>
      </div>
    </div></div>
  );
}

export default WarehouseDashboard;
