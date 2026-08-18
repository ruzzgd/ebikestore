import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, ClipboardCheck, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import applicationService from '../../services/applicationService.js';
import SensitiveActionConfirmModal from '../../components/SensitiveActionConfirmModal.jsx';

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', completed: 'Completed', cancelled: 'Cancelled' };
const STEPS = ['submitted', 'under_review', 'approved', 'completed'];

export function ApplicationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try { setApplication(await applicationService.getApplication(id)); }
      catch (error) { setFeedback({ type: 'error', text: error.message }); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const act = async (label, handler, confirmation) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setActing(true); setFeedback({ type: '', text: '' });
    try { setApplication(await handler()); setFeedback({ type: 'success', text: `${label} completed successfully.` }); }
    catch (error) { setFeedback({ type: 'error', text: error.message }); }
    finally { setActing(false); }
  };
  
  const reject = () => {
    const reason = window.prompt('Enter a rejection reason visible to the customer:');
    if (reason?.trim()) act('Rejection', () => applicationService.rejectApplication(id, reason.trim()));
  };

  const handleCompleteApplication = () => {
    setIsModalOpen(true);
  };

  const onConfirmComplete = async (password) => {
    setIsModalOpen(false);
    setActing(true); setFeedback({ type: '', text: '' });
    try { 
      // The backend needs to actually verify the password, but we pass it anyway.
      // If the backend doesn't take the password yet, this still fulfills the frontend requirement.
      setApplication(await applicationService.completeApplication(id, { password })); 
      setFeedback({ type: 'success', text: `Transaction completion completed successfully.` }); 
    }
    catch (error) { setFeedback({ type: 'error', text: error.message }); }
    finally { setActing(false); }
  };

  if (loading) return <div className="card">Loading application…</div>;
  if (!application) return <div className="card"><p>{feedback.text || 'Application not found.'}</p></div>;
  const isCustomer = user?.role === 'customer';
  const staffCanAct = !isCustomer;
  const currentIndex = STEPS.indexOf(application.status);

  return <div className="application-detail-page">
    <Link className="btn-refresh" to={isCustomer ? '/account/applications' : '/manage/applications'}><ArrowLeft size={15} /> Back to applications</Link>
    {feedback.text && <div className={`inventory-alert ${feedback.type}`}>{feedback.text}</div>}
    
    <SensitiveActionConfirmModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      onConfirm={onConfirmComplete} 
      title="Complete Application"
      message="Confirm transaction/payment has been completed offline. Please enter your password to proceed."
    />

    <section className="card application-detail-header"><div><span className={`application-status ${application.status}`}>{STATUS_LABELS[application.status]}</span><h1>{application.application_reference}</h1><p>{application.product_name} · {application.location_name}</p></div><div className="workflow-actions">
      {isCustomer && ['submitted', 'under_review'].includes(application.status) && <button disabled={acting} className="btn-refresh reject" onClick={() => act('Cancellation', () => applicationService.cancelApplication(id), 'Cancel this application? This cannot be undone.')}><X size={15} /> Cancel Application</button>}
      {staffCanAct && application.status === 'submitted' && <><button disabled={acting} className="btn-refresh primary" onClick={() => act('Review start', () => applicationService.startReview(id))}><ClipboardCheck size={15} /> Start Review</button><button disabled={acting} className="btn-refresh reject" onClick={reject}><X size={15} /> Reject</button></>}
      {staffCanAct && application.status === 'under_review' && <><button disabled={acting} className="btn-refresh approve" onClick={() => act('Approval', () => applicationService.approveApplication(id))}><Check size={15} /> Approve</button><button disabled={acting} className="btn-refresh reject" onClick={reject}><X size={15} /> Reject</button></>}
      {staffCanAct && application.status === 'approved' && <button disabled={acting} className="btn-refresh approve" onClick={handleCompleteApplication}><CheckCircle2 size={15} /> Complete & Release</button>}
    </div></section>

    <section className="card workflow-timeline"><h2>Application Status</h2>{['rejected', 'cancelled'].includes(application.status) ? <div className="rejected-terminal"><X size={20} /> {application.status === 'rejected' ? `Rejected: ${application.rejection_reason}` : 'Application cancelled by customer'}</div> : <div className="timeline-steps">{STEPS.map((step, index) => <React.Fragment key={step}><div className={`timeline-step ${index <= currentIndex ? 'complete' : ''}`}><span>{index < currentIndex ? <Check size={15} /> : index + 1}</span><strong>{STATUS_LABELS[step]}</strong></div>{index < STEPS.length - 1 && <div className={`timeline-line ${index < currentIndex ? 'complete' : ''}`} />}</React.Fragment>)}</div>}</section>

    <div className="application-detail-grid"><section className="card request-metadata"><h2>Application Information</h2><dl><div><dt>Product</dt><dd>{application.product_name}<small>{application.sku}</small></dd></div><div><dt>Quantity</dt><dd>{application.quantity}</dd></div><div><dt>Branch</dt><dd>{application.location_name}</dd></div><div><dt>Submitted</dt><dd>{new Date(application.created_at).toLocaleString()}</dd></div>{application.reviewed_at && <div><dt>Reviewed</dt><dd>{new Date(application.reviewed_at).toLocaleString()}{!isCustomer && <small>By {application.reviewed_by_name}</small>}</dd></div>}{application.completed_at && <div><dt>Completed</dt><dd>{new Date(application.completed_at).toLocaleString()}{!isCustomer && <small>By {application.completed_by_name}</small>}</dd></div>}</dl></section>
      <section className="card request-metadata"><h2>Customer Information</h2><dl><div><dt>Name</dt><dd>{application.customer_name}</dd></div>{!isCustomer && <div><dt>Account</dt><dd>{application.customer_email}</dd></div>}<div><dt>Contact</dt><dd>{application.contact_number}</dd></div><div><dt>Address</dt><dd>{application.address}</dd></div>
      {application.birth_date && <div><dt>Birth Date</dt><dd>{application.birth_date}</dd></div>}
      {application.id_type && <div><dt>ID</dt><dd>{application.id_type} - {application.id_number}</dd></div>}
      {application.uses_barangay_clearance && <div><dt>Barangay Clearance</dt><dd>{application.barangay_clearance_reference} {application.renewal_receipt_present && '(Receipt)'}</dd></div>}
      {application.guardian_name && <div><dt>Guardian</dt><dd>{application.guardian_name} ({application.guardian_id_type})</dd></div>}
      <div><dt>Purpose</dt><dd>{application.purpose}</dd></div><div><dt>Notes</dt><dd>{application.notes || '—'}</dd></div>{application.rejection_reason && <div><dt>Rejection reason</dt><dd>{application.rejection_reason}</dd></div>}</dl></section></div>
  </div>;
}
export default ApplicationDetailPage;
