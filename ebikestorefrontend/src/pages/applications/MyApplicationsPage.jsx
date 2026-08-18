import React, { useEffect, useState } from 'react';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import applicationService from '../../services/applicationService.js';

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', completed: 'Completed', cancelled: 'Cancelled' };

export function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try { setApplications(await applicationService.getMyApplications({ status })); }
      catch (loadError) { setError(loadError.message); }
      finally { setLoading(false); }
    };
    load();
  }, [status]);

  return <div>
    <div className="inventory-heading"><div><h1>My Applications</h1><p>Track applications submitted to Fidelo branch locations.</p></div><select className="application-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {error && <div className="inventory-alert error">{error}</div>}
    {loading ? <div className="card">Loading your applications…</div> : applications.length === 0 ? <div className="card application-empty"><ClipboardList size={42} /><h2>No applications found</h2><p>Applications you submit from product pages will appear here.</p><Link className="btn-refresh primary" to="/products">Browse Products</Link></div> : <div className="application-cards">{applications.map((application) => <Link to={`/applications/${application.id}`} className="card application-list-card" key={application.id}><div><span className={`application-status ${application.status}`}>{STATUS_LABELS[application.status]}</span><strong>{application.application_reference}</strong><h3>{application.product_name}</h3><p>{application.location_name} · Quantity {application.quantity}</p><small>Submitted {new Date(application.created_at).toLocaleString()}</small></div><ExternalLink size={18} /></Link>)}</div>}
  </div>;
}
export default MyApplicationsPage;
