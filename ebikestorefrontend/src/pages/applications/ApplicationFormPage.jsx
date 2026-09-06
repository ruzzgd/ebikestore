import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardPen, ShieldAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import applicationService from '../../services/applicationService.js';
import locationService from '../../services/locationService.js';
import productService from '../../services/productService.js';
import ErrorModal from '../../components/ErrorModal.jsx';

const inputStyle = { width: '100%', padding: '.65rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' };
const checkboxStyle = { marginRight: '0.5rem' };

const PHILIPPINE_ID_TYPES = [
  'National ID (PhilSys)',
  "Driver's License",
  'Philippine Passport',
  'Social Security System (SSS) / UMID Card',
  'PhilHealth ID',
  "Voter's ID / COMELEC Certificate",
  'Postal ID',
  'Professional Regulation Commission (PRC) ID',
  'Senior Citizen ID',
  'Person with Disability (PWD) ID',
  'Barangay Clearance / Certificate',
  'Government Service Insurance System (GSIS) e-Card',
  'Student ID',
  'Other Valid Government ID',
];

const ReqAsterisk = () => <span style={{ color: '#dc2626', marginLeft: '3px', fontWeight: 'bold' }}>*</span>;

export function ApplicationFormPage() {
  const { productId } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [locations, setLocations] = useState([]);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [form, setForm] = useState({ 
    locationId: '', customerName: user?.name || '', contactNumber: '', address: '', quantity: 1, purpose: '', notes: '',
    birth_date: '', id_type: '', id_number: '', id_expiration_date: '',
    uses_barangay_clearance: false, barangay_clearance_reference: '', renewal_receipt_present: false,
    guardian_name: '', guardian_id_type: '', guardian_id_number: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [productData, locationData] = await Promise.all([
          productService.getProductById(productId),
          locationService.getLocations()
        ]);
        setProduct(productData);
        const branches = locationData.filter((location) => location.is_active && location.type === 'branch');
        setLocations(branches);

        // Select the first available branch that has stock
        const firstAvailable = branches.find((branch) => {
          const avail = productData?.availability_by_location?.find((a) => a.location_id === branch.id);
          return avail && avail.availability !== 'out_of_stock';
        });

        if (firstAvailable) {
          setForm((current) => ({ ...current, locationId: firstAvailable.id }));
        } else if (branches.length > 0) {
          setForm((current) => ({ ...current, locationId: '' }));
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDateObj = new Date(dob);
    const referenceDate = new Date();
    let age = referenceDate.getFullYear() - birthDateObj.getFullYear();
    const m = referenceDate.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && referenceDate.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const isMinor = form.birth_date ? calculateAge(form.birth_date) < 18 : false;

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    // Phone validation (+63 9XX XXX XXXX)
    const cleanPhone = phoneLocal.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !cleanPhone.startsWith('9')) {
      setError('Please enter a valid 10-digit Philippine mobile number starting with 9 (e.g. 917 123 4567).');
      return;
    }

    if (!form.locationId) {
      setError('Please select an available branch to complete this transaction.');
      return;
    }

    // Verify selected branch is not out of stock
    const selectedBranchAvail = product?.availability_by_location?.find(
      (a) => a.location_id === Number(form.locationId)
    );
    if (selectedBranchAvail && selectedBranchAvail.availability === 'out_of_stock') {
      setError('The selected transaction branch is currently out of stock for this product. Please choose another location.');
      return;
    }

    if (!form.id_type) {
      setError('Please select a valid ID Type.');
      return;
    }

    setSubmitting(true);
    try { 
      const payload = {
        ...form,
        contactNumber: `+63${cleanPhone}`,
        productId: Number(productId),
        locationId: Number(form.locationId),
        quantity: Number(form.quantity),
      };
      setSubmitted(await applicationService.createApplication(payload)); 
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="card">Loading application form…</div>;

  if (submitted) {
    return (
      <div className="application-success card">
        <CheckCircle2 size={52} />
        <h1>Your application has been submitted.</h1>
        <p>This is an application for store review—not an online purchase or payment confirmation.</p>
        <div><span>Reference</span><strong>{submitted.application_reference}</strong></div>
        <div><span>Product</span><strong>{submitted.product_name}</strong></div>
        <div><span>Branch</span><strong>{submitted.location_name}</strong></div>
        <div><span>Status</span><strong>Submitted</strong></div>
        <nav>
          <Link className="btn-refresh primary" to="/account/applications">My Applications</Link>
          <Link className="btn-refresh" to="/products">Product Catalog</Link>
        </nav>
      </div>
    );
  }

  return (
    <div className="application-form-page">
      <Link to={`/products/${productId}`} className="btn-refresh">
        <ArrowLeft size={15} /> Back to product
      </Link>

      <div className="application-form-layout">
        <aside className="card application-product-summary">
          <span className="tech-tag">{product?.category_name}</span>
          <h2>{product?.name}</h2>
          <p>SKU: {product?.sku}</p>
          <p>{product?.description}</p>
          <div className="offline-note">
            <strong>Store application only</strong>
            <span>No online payment is collected. Availability is rechecked when the unit is released.</span>
          </div>
        </aside>

        <section className="card application-form-card">
          <h1><ClipboardPen size={25} /> Start Application</h1>
          <form onSubmit={submit}>
            <label style={{ display: 'block', marginBottom: '1.25rem' }}>
              <span>Transaction branch <ReqAsterisk /></span>
              <select
                required
                style={inputStyle}
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              >
                <option value="">Select branch</option>
                {locations.map((location) => {
                  const branchAvail = product?.availability_by_location?.find((a) => a.location_id === location.id);
                  const isOutOfStock = branchAvail && branchAvail.availability === 'out_of_stock';
                  return (
                    <option key={location.id} value={location.id} disabled={isOutOfStock}>
                      {location.name} {isOutOfStock ? '(Out of Stock - Unavailable)' : '(In Stock)'}
                    </option>
                  );
                })}
              </select>
            </label>
            
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <ShieldAlert size={18} /> Identity Information
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                Information is collected securely for store transaction processing. Fields marked with <ReqAsterisk /> are mandatory.
              </p>
              
              <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label>
                  <span>Customer name <ReqAsterisk /></span>
                  <input required maxLength="255" style={inputStyle} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                </label>
                <label>
                  <span>Birth Date <ReqAsterisk /></span>
                  <input required type="date" style={inputStyle} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </label>
                <label>
                  <span>ID Type <ReqAsterisk /></span>
                  <select
                    required
                    style={inputStyle}
                    value={form.id_type}
                    onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                  >
                    <option value="">-- Select Valid ID --</option>
                    {PHILIPPINE_ID_TYPES.map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>ID Number <ReqAsterisk /></span>
                  <input required maxLength="100" style={inputStyle} value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} placeholder="e.g. ID-123456789" />
                </label>
                <label>
                  <span>ID Expiration Date <ReqAsterisk /></span>
                  <input required type="date" style={inputStyle} value={form.id_expiration_date} onChange={(e) => setForm({ ...form, id_expiration_date: e.target.value })} />
                </label>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" style={checkboxStyle} checked={form.uses_barangay_clearance} onChange={(e) => setForm({ ...form, uses_barangay_clearance: e.target.checked })} />
                Uses Barangay Clearance
              </label>
              
              {form.uses_barangay_clearance && (
                <div className="responsive-form-row nested-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginLeft: '1.5rem', marginBottom: '1rem' }}>
                  <label>
                    <span>Clearance Reference <ReqAsterisk /></span>
                    <input required maxLength="100" style={inputStyle} value={form.barangay_clearance_reference} onChange={(e) => setForm({ ...form, barangay_clearance_reference: e.target.value })} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                    <input type="checkbox" style={checkboxStyle} checked={form.renewal_receipt_present} onChange={(e) => setForm({ ...form, renewal_receipt_present: e.target.checked })} />
                    Renewal Receipt Present
                  </label>
                </div>
              )}

              {isMinor && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Guardian Information (Required for Minors)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <label>
                      <span>Guardian Name <ReqAsterisk /></span>
                      <input required maxLength="255" style={inputStyle} value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
                    </label>
                  </div>
                  <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <label>
                      <span>Guardian ID Type <ReqAsterisk /></span>
                      <select
                        required
                        style={inputStyle}
                        value={form.guardian_id_type}
                        onChange={(e) => setForm({ ...form, guardian_id_type: e.target.value })}
                      >
                        <option value="">-- Select Guardian ID --</option>
                        {PHILIPPINE_ID_TYPES.map((id) => (
                          <option key={`g-${id}`} value={id}>{id}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Guardian ID Number <ReqAsterisk /></span>
                      <input required maxLength="100" style={inputStyle} value={form.guardian_id_number} onChange={(e) => setForm({ ...form, guardian_id_number: e.target.value })} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem' }}>
                <span>Contact number <ReqAsterisk /></span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ padding: '.65rem .75rem', background: '#e2e8f0', border: '1px solid var(--color-border)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                  +63
                </span>
                <input
                  required
                  type="tel"
                  placeholder="9XXXXXXXXX"
                  maxLength={10}
                  pattern="^9[0-9]{9}$"
                  title="Please enter a valid 10-digit Philippine mobile number starting with 9 (e.g. 9171234567)"
                  style={{ ...inputStyle, borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  value={phoneLocal}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhoneLocal(digits);
                    setForm((curr) => ({ ...curr, contactNumber: digits ? `+63${digits}` : '' }));
                  }}
                />
              </div>
              <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>
                Verified mobile number: 10 digits starting with 9 (e.g., 917 123 4567)
              </small>
            </div>

            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span>Address <ReqAsterisk /></span>
              <textarea required maxLength="500" rows="3" style={inputStyle} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span>Quantity <ReqAsterisk /></span>
              <input required min="1" step="1" type="number" style={inputStyle} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </label>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span>Purpose / transaction intent <ReqAsterisk /></span>
              <textarea required maxLength="500" rows="2" style={inputStyle} placeholder="Briefly describe your intended transaction" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </label>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span>Notes (optional)</span>
              <textarea maxLength="1000" rows="3" style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            <button className="btn-refresh primary" disabled={submitting} style={{ marginTop: '1rem' }}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </section>
      </div>

      <ErrorModal
        isOpen={Boolean(error)}
        title="Application Submission"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  );
}

export default ApplicationFormPage;
