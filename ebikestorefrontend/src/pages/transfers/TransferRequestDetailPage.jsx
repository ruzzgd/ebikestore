import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, PackageCheck, Send, X, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import requestService from '../../services/interBranchRequestService.js';
import SensitiveActionConfirmModal from '../../components/SensitiveActionConfirmModal.jsx';

const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', in_transit: 'In Transit', received: 'Received' };
const STEPS = ['pending', 'approved', 'in_transit', 'received'];

export function TransferRequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [modalConfig, setModalConfig] = useState({ isOpen: false, actionLabel: '', handler: null });

  const loadRequest = async () => {
    setLoading(true);
    try { setRequest(await requestService.getRequest(id)); }
    catch (error) { setFeedback({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadRequest(); }, [id]);

  const runAction = (action, handler) => {
    setModalConfig({ isOpen: true, actionLabel: action, handler });
  };

  const confirmAction = async (password) => {
    const { actionLabel, handler } = modalConfig;
    setActing(actionLabel);
    setFeedback({ type: '', text: '' });
    try {
      setRequest(await handler(id, password));
      setFeedback({ type: 'success', text: `Request ${actionLabel} completed successfully.` });
      setModalConfig({ isOpen: false, actionLabel: '', handler: null });
    } catch (error) { throw error; }
    finally { setActing(''); }
  };

  if (loading) return <div className="card" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '2rem' }}><RefreshCw size={18} className="spin-icon" /> Loading transfer request...</div>;
  if (!request) return <div className="card"><p>{feedback.text || 'Request not found.'}</p><Link to="/transfers" className="btn-refresh">Back to requests</Link></div>;

  const isAdmin = user?.role === 'admin';
  const isOwnRequest = Number(user?.id) === Number(request.requested_by_user_id);
  const canApprove = !isOwnRequest && (isAdmin || Number(user?.location_id) === Number(request.source_location_id)) && request.status === 'pending';
  const canDispatch = request.status === 'approved' && (isAdmin || Number(user?.location_id) === Number(request.source_location_id));
  const canReceive = request.status === 'in_transit' && (isAdmin || Number(user?.location_id) === Number(request.destination_location_id));
  const currentIndex = STEPS.indexOf(request.status);

  return (
    <div className="transfer-detail">
      <Link to="/transfers" className="btn-refresh"><ArrowLeft size={15} /> Back to requests</Link>
      {feedback.text && <div className={`inventory-alert ${feedback.type}`}>{feedback.text}</div>}
      <section className="card transfer-detail-header">
        <div><span className={`request-status ${request.status}`}>{STATUS_LABELS[request.status]}</span><h1>{request.request_reference}</h1><p>{request.source_location_name} <ArrowRight size={15} /> {request.destination_location_name}</p></div>
        <div className="workflow-actions">
          {isOwnRequest && request.status === 'pending' && <small className="muted">Your request must be reviewed by another authorized user.</small>}
          {canApprove && <><button disabled={acting} className="btn-refresh approve" onClick={() => runAction('approval', requestService.approveRequest)}><Check size={16} /> Approve</button><button disabled={acting} className="btn-refresh reject" onClick={() => runAction('rejection', requestService.rejectRequest)}><X size={16} /> Reject</button></>}
          {canDispatch && <button disabled={acting} className="btn-refresh primary" onClick={() => runAction('dispatch', requestService.dispatchRequest)}><Send size={16} /> Dispatch stock</button>}
          {canReceive && <button disabled={acting} className="btn-refresh approve" onClick={() => runAction('receipt', requestService.receiveRequest)}><PackageCheck size={16} /> Confirm receipt</button>}
        </div>
      </section>

      <section className="card workflow-timeline">
        <h2>Status Timeline</h2>
        {request.status === 'rejected' ? <div className="rejected-terminal"><X size={20} /> Request rejected by {request.rejected_by_name || 'administrator'} on {new Date(request.rejected_at).toLocaleString()}</div> : (
          <div className="timeline-steps">{STEPS.map((step, index) => <React.Fragment key={step}><div className={`timeline-step ${index <= currentIndex ? 'complete' : ''}`}><span>{index < currentIndex ? <Check size={15} /> : index + 1}</span><strong>{STATUS_LABELS[step]}</strong></div>{index < STEPS.length - 1 && <div className={`timeline-line ${index < currentIndex ? 'complete' : ''}`} />}</React.Fragment>)}</div>
        )}
      </section>

      <div className="transfer-detail-grid">
        <section className="card">
          <h2>Requested Items</h2>
          <div className="table-scroll"><table className="inventory-table"><thead><tr><th>Product</th><th>Requested</th><th>Dispatched</th><th>Received</th></tr></thead><tbody>{request.items.map((item) => <tr key={item.id}><td><strong>{item.product_name}</strong><small>{item.sku}</small></td><td>{item.quantity_requested}</td><td>{item.quantity_dispatched}</td><td>{item.quantity_received}</td></tr>)}</tbody></table></div>
        </section>
        <aside className="card request-metadata">
          <h2>Request Details</h2>
          <dl><div><dt>Requested by</dt><dd>{request.requested_by_name}</dd></div><div><dt>Requested</dt><dd>{new Date(request.requested_at).toLocaleString()}</dd></div>{request.requested_delivery_date && <div><dt>Delivery Date</dt><dd>{new Date(request.requested_delivery_date).toLocaleDateString()}</dd></div>}{request.approved_at && <div><dt>Approved by</dt><dd>{request.approved_by_name}<small>{new Date(request.approved_at).toLocaleString()}</small></dd></div>}{request.dispatched_at && <div><dt>Dispatched by</dt><dd>{request.dispatched_by_name}<small>{new Date(request.dispatched_at).toLocaleString()}</small></dd></div>}{request.received_at && <div><dt>Received by</dt><dd>{request.received_by_name}<small>{new Date(request.received_at).toLocaleString()}</small></dd></div>}<div><dt>Reason</dt><dd>{request.reason_for_transfer || '—'}</dd></div><div><dt>Note</dt><dd>{request.note || '—'}</dd></div></dl>
        </aside>
      </div>
      <SensitiveActionConfirmModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ isOpen: false, actionLabel: '', handler: null })} onConfirm={confirmAction} title={`Confirm ${modalConfig.actionLabel}`} message={`Please enter your password to confirm ${modalConfig.actionLabel} for this request.`} />
    </div>
  );
}

export default TransferRequestDetailPage;
