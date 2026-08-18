import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import inventoryService from '../services/inventoryService.js';
import requestService from '../services/interBranchRequestService.js';
import applicationService from '../services/applicationService.js';

export function OperationalWarnings() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ lowStock: 0, transfers: 0, applications: 0 });
  const [error, setError] = useState('');
  useEffect(() => {
    const load = async () => {
      try {
        const locationId = user?.role === 'admin' ? '' : user?.location_id;
        const [lowStock, transfers] = await Promise.all([
          inventoryService.getLowStock({ locationId }), requestService.listRequests(),
        ]);
        let applications = [];
        if (['admin', 'branch_staff'].includes(user?.role)) {
          const [submitted, underReview] = await Promise.all([
            applicationService.getApplications({ status: 'submitted' }),
            applicationService.getApplications({ status: 'under_review' }),
          ]);
          applications = [...submitted, ...underReview];
        }
        setCounts({
          lowStock: lowStock.length,
          transfers: transfers.filter((request) => ['pending', 'approved', 'in_transit'].includes(request.status)).length,
          applications: applications.length,
        });
      } catch (loadError) { setError(loadError.message); }
    };
    if (user) load();
  }, [user]);

  if (error) return <div className="operational-warning-error">Operational warnings unavailable: {error}</div>;
  return <section className="operational-warnings" aria-label="Operational warnings">
    <Link to="/inventory" className={`operational-warning-card ${counts.lowStock ? 'active' : ''}`}><AlertTriangle size={22} /><div><strong>{counts.lowStock}</strong><span>Low-stock item{counts.lowStock === 1 ? '' : 's'}</span></div></Link>
    <Link to="/transfers" className={`operational-warning-card ${counts.transfers ? 'active' : ''}`}><ArrowLeftRight size={22} /><div><strong>{counts.transfers}</strong><span>Active transfer{counts.transfers === 1 ? '' : 's'}</span></div></Link>
    {['admin', 'branch_staff'].includes(user?.role) && <Link to="/manage/applications" className={`operational-warning-card ${counts.applications ? 'active' : ''}`}><ClipboardCheck size={22} /><div><strong>{counts.applications}</strong><span>Application{counts.applications === 1 ? '' : 's'} needing review</span></div></Link>}
  </section>;
}
export default OperationalWarnings;
