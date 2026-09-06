import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, ClipboardCheck, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import applicationService from '../../services/applicationService.js';
import SensitiveActionConfirmModal from '../../components/SensitiveActionConfirmModal.jsx';
import ErrorModal from '../../components/ErrorModal.jsx';

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', completed: 'Completed', cancelled: 'Cancelled' };
const STEPS = ['submitted', 'under_review', 'approved', 'completed'];

export function ApplicationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const load = async () => {
      try { setApplication(await applicationService.getApplication(id)); }
      catch (error) { 
        setFeedback({ type: 'error', text: error.message }); 
        setErrorMessage(error.message);
      }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const act = async (label, handler, confirmation) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setActing(true); setFeedback({ type: '', text: '' });
    try { 
      setApplication(await handler()); 
      setFeedback({ type: 'success', text: `${label} completed successfully.` }); 
    }
    catch (error) { 
      setFeedback({ type: 'error', text: error.message }); 
      setErrorMessage(error.message || `${label} failed`);
    }
    finally { setActing(false); }
  };
  
  const handleOpenRejectModal = () => {
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setIsRejectModalOpen(false);
    await act('Rejection', () => applicationService.rejectApplication(id, rejectionReason.trim()));
  };

  const handleCompleteApplication = () => {
    setIsModalOpen(true);
  };

  const onConfirmComplete = async (password) => {
    setIsModalOpen(false);
    setActing(true); setFeedback({ type: '', text: '' });
    try { 
      setApplication(await applicationService.completeApplication(id, password)); 
      setFeedback({ type: 'success', text: `Transaction completed successfully. Product released.` }); 
    }
    catch (error) { 
      setFeedback({ type: 'error', text: error.message }); 
      setErrorMessage(error.message || 'Password confirmation failed');
    }
    finally { setActing(false); }
  };

  if (loading) return <div className="card">Loading application…</div>;
  if (!application) return <div className="card"><p>{feedback.text || 'Application not found.'}</p></div>;
  const isCustomer = user?.role === 'customer';
  const staffCanAct = !isCustomer;
  const currentIndex = STEPS.indexOf(application.status);

  return (
    <div className="application-detail-page">
      <Link className="btn-refresh" to={isCustomer ? '/account/applications' : '/manage/applications'}>
        <ArrowLeft size={15} /> Back to applications
      </Link>
      
      {feedback.text && feedback.type === 'success' && (
        <div className={`inventory-alert ${feedback.type}`}>{feedback.text}</div>
      )}
      
      <SensitiveActionConfirmModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={onConfirmComplete} 
        title="Complete Application & Release Stock"
        message="Confirm that customer payment has been verified offline. Enter your password to complete order and deduct branch inventory."
      />

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={20} /> Reject Application
              </h2>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem' }}>
              Please enter the rejection message below. This note will be recorded and shown to the customer.
            </p>
            <form onSubmit={handleConfirmReject}>
              <label style={{ display: 'block', marginBottom: '1.25rem' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Rejection Reason / Message *
                </span>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete verification documents. Please re-apply with a valid primary government ID."
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9rem', color: '#0f172a' }}
                  autoFocus
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn-refresh" onClick={() => setIsRejectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-refresh reject" disabled={!rejectionReason.trim() || acting}>
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="card application-detail-header">
        <div>
          <span className={`application-status ${application.status}`}>{STATUS_LABELS[application.status]}</span>
          <h1>{application.application_reference}</h1>
          <p>{application.product_name} · {application.location_name}</p>
        </div>
        <div className="workflow-actions">
          {isCustomer && ['submitted', 'under_review'].includes(application.status) && (
            <button disabled={acting} className="btn-refresh reject" onClick={() => act('Cancellation', () => applicationService.cancelApplication(id), 'Cancel this application? This cannot be undone.')}>
              <X size={15} /> Cancel Application
            </button>
          )}
          {staffCanAct && application.status === 'submitted' && (
            <>
              <button disabled={acting} className="btn-refresh primary" onClick={() => act('Review start', () => applicationService.startReview(id))}>
                <ClipboardCheck size={15} /> Start Review
              </button>
              <button disabled={acting} className="btn-refresh reject" onClick={handleOpenRejectModal}>
                <X size={15} /> Reject
              </button>
            </>
          )}
          {staffCanAct && application.status === 'under_review' && (
            <>
              <button disabled={acting} className="btn-refresh approve" onClick={() => act('Approval', () => applicationService.approveApplication(id))}>
                <Check size={15} /> Approve
              </button>
              <button disabled={acting} className="btn-refresh reject" onClick={handleOpenRejectModal}>
                <X size={15} /> Reject
              </button>
            </>
          )}
          {staffCanAct && application.status === 'approved' && (
            <button disabled={acting} className="btn-refresh approve" onClick={handleCompleteApplication}>
              <CheckCircle2 size={15} /> Complete & Release
            </button>
          )}
        </div>
      </section>

      <section className="card workflow-timeline">
        <h2>Application Status</h2>
        {['rejected', 'cancelled'].includes(application.status) ? (
          <div className="rejected-terminal">
            <X size={20} /> {application.status === 'rejected' ? `Rejected: ${application.rejection_reason}` : 'Application cancelled by customer'}
          </div>
        ) : (
          <div className="timeline-steps">
            {STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <div className={`timeline-step ${index <= currentIndex ? 'complete' : ''}`}>
                  <span>{index < currentIndex ? <Check size={15} /> : index + 1}</span>
                  <strong>{STATUS_LABELS[step]}</strong>
                </div>
                {index < STEPS.length - 1 && <div className={`timeline-line ${index < currentIndex ? 'complete' : ''}`} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      <div className="application-detail-grid">
        <section className="card request-metadata">
          <h2>Application Information</h2>
          <dl>
            <div><dt>Product</dt><dd>{application.product_name}<small>{application.sku}</small></dd></div>
            <div><dt>Quantity</dt><dd>{application.quantity}</dd></div>
            <div><dt>Branch</dt><dd>{application.location_name}</dd></div>
            <div><dt>Submitted</dt><dd>{new Date(application.created_at).toLocaleString()}</dd></div>
            {application.reviewed_at && <div><dt>Reviewed</dt><dd>{new Date(application.reviewed_at).toLocaleString()}{!isCustomer && <small>By {application.reviewed_by_name}</small>}</dd></div>}
            {application.completed_at && <div><dt>Completed</dt><dd>{new Date(application.completed_at).toLocaleString()}{!isCustomer && <small>By {application.completed_by_name}</small>}</dd></div>}
          </dl>
        </section>

        <section className="card request-metadata">
          <h2>Customer Information</h2>
          <dl>
            <div><dt>Name</dt><dd>{application.customer_name}</dd></div>
            {!isCustomer && <div><dt>Account</dt><dd>{application.customer_email}</dd></div>}
            <div><dt>Contact</dt><dd>{application.contact_number}</dd></div>
            <div><dt>Address</dt><dd>{application.address}</dd></div>
            {application.birth_date && <div><dt>Birth Date</dt><dd>{application.birth_date}</dd></div>}
            {application.id_type && <div><dt>ID</dt><dd>{application.id_type} - {application.id_number}</dd></div>}
            {application.uses_barangay_clearance && <div><dt>Barangay Clearance</dt><dd>{application.barangay_clearance_reference} {application.renewal_receipt_present && '(Receipt)'}</dd></div>}
            {application.guardian_name && <div><dt>Guardian</dt><dd>{application.guardian_name} ({application.guardian_id_type})</dd></div>}
            <div><dt>Purpose</dt><dd>{application.purpose}</dd></div>
            <div><dt>Notes</dt><dd>{application.notes || '—'}</dd></div>
            {application.rejection_reason && <div><dt>Rejection reason</dt><dd style={{ color: '#dc2626', fontWeight: 600 }}>{application.rejection_reason}</dd></div>}
          </dl>
        </section>
      </div>

      <ErrorModal
        isOpen={Boolean(errorMessage)}
        title="Application Error"
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />
    </div>
  );
}

export default ApplicationDetailPage;
