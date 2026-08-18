import React, { useEffect, useState } from 'react';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import applicationService from '../../services/applicationService.js';
import locationService from '../../services/locationService.js';

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', completed: 'Completed', cancelled: 'Cancelled' };

export function ApplicationManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [applications, setApplications] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({ status: '', locationId: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const requests = [applicationService.getApplications(filters)];
      if (isAdmin) requests.push(locationService.getLocations());
      const [applicationData, locationData = []] = await Promise.all(requests);
      setApplications(applicationData); setLocations(locationData.filter((location) => location.is_active && location.type === 'branch'));
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters.status, filters.locationId]);

  return <div>
    <div className="inventory-heading"><div><h1>Customer Applications</h1><p>{isAdmin ? 'All customer-facing branches' : user?.location_name} · offline transaction workflow</p></div></div>
    <div className="card application-management-filters">
      <label>Status<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {isAdmin && <label>Branch<select value={filters.locationId} onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}><option value="">All branches</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
      <label>From<input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} /></label><label>To<input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} /></label><button className="btn-refresh" onClick={load}>Apply dates</button>
    </div>
    {error && <div className="inventory-alert error">{error}</div>}
    <section className="card">
      {loading ? <p>Loading applications…</p> : applications.length === 0 ? <div className="application-empty"><ClipboardCheck size={40} /><h2>No applications match these filters</h2></div> : <div className="table-scroll"><table className="inventory-table"><thead><tr><th>Reference</th><th>Customer</th><th>Product</th><th>Qty</th><th>Branch</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>{applications.map((application) => <tr key={application.id}><td><strong>{application.application_reference}</strong></td><td>{application.customer_name}<small>{application.customer_email}</small></td><td>{application.product_name}<small>{application.sku}</small></td><td>{application.quantity}</td><td>{application.location_name}</td><td>{new Date(application.created_at).toLocaleDateString()}</td><td><span className={`application-status ${application.status}`}>{STATUS_LABELS[application.status]}</span></td><td><Link className="btn-refresh" to={`/applications/${application.id}`}><ExternalLink size={14} /> Review</Link></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
export default ApplicationManagementPage;
