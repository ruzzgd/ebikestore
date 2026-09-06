import React, { useEffect, useState } from 'react';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import applicationService from '../../services/applicationService.js';
import ErrorModal from '../../components/ErrorModal.jsx';

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setApplications(await applicationService.getMyApplications({ status }));
      } catch (loadError) {
        setError(loadError.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status]);

  return (
    <div>
      <div className="inventory-heading">
        <div>
          <h1>My Applications</h1>
          <p>Track applications submitted to Fidelo branch locations.</p>
        </div>
        <select
          className="application-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card">Loading your applications…</div>
      ) : applications.length === 0 ? (
        <div className="card application-empty">
          <ClipboardList size={42} />
          <h2>No applications found</h2>
          <p>Applications you submit from product pages will appear here.</p>
          <Link className="btn-refresh primary" to="/account/products">Browse Products</Link>
        </div>
      ) : (
        <section className="card">
          <div className="table-scroll">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.product_name}</strong>
                      <small style={{ display: 'block', color: 'var(--color-text-secondary)' }}>
                        Ref: {application.application_reference} · {application.location_name}
                      </small>
                    </td>
                    <td className="quantity-cell">
                      {application.quantity}
                    </td>
                    <td>
                      {new Date(application.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className={`application-status ${application.status}`}>
                        {STATUS_LABELS[application.status] || application.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="btn-refresh"
                        to={`/applications/${application.id}`}
                        title="View Application Details"
                      >
                        <ExternalLink size={14} /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ErrorModal
        isOpen={Boolean(error)}
        title="Applications Error"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  );
}

export default MyApplicationsPage;
