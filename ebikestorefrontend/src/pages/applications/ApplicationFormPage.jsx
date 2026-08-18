import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardPen, ShieldAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import applicationService from '../../services/applicationService.js';
import locationService from '../../services/locationService.js';
import productService from '../../services/productService.js';

const inputStyle = { width: '100%', padding: '.65rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' };
const checkboxStyle = { marginRight: '0.5rem' };

export function ApplicationFormPage() {
  const { productId } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [locations, setLocations] = useState([]);
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
        const [productData, locationData] = await Promise.all([productService.getProductById(productId), locationService.getLocations()]);
        setProduct(productData);
        const branches = locationData.filter((location) => location.is_active && location.type === 'branch');
        setLocations(branches);
        if (branches.length) setForm((current) => ({ ...current, locationId: branches[0].id }));
      } catch (loadError) { setError(loadError.message); }
      finally { setLoading(false); }
    };
    load();
  }, [productId]);

  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try { 
      const payload = { ...form, productId: Number(productId), locationId: Number(form.locationId), quantity: Number(form.quantity) };
      setSubmitted(await applicationService.createApplication(payload)); 
    }
    catch (submitError) { setError(submitError.message); }
    finally { setSubmitting(false); }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDateObj = new Date(dob);
    const referenceDate = new Date('2026-08-13');
    let age = referenceDate.getFullYear() - birthDateObj.getFullYear();
    const m = referenceDate.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && referenceDate.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age;
  };

  const isMinor = form.birth_date ? calculateAge(form.birth_date) < 18 : false;

  if (loading) return <div className="card">Loading application form…</div>;
  if (submitted) return <div className="application-success card"><CheckCircle2 size={52} /><h1>Your application has been submitted.</h1><p>This is an application for store review—not an online purchase or payment confirmation.</p><div><span>Reference</span><strong>{submitted.application_reference}</strong></div><div><span>Product</span><strong>{submitted.product_name}</strong></div><div><span>Branch</span><strong>{submitted.location_name}</strong></div><div><span>Status</span><strong>Submitted</strong></div><nav><Link className="btn-refresh primary" to="/account/applications">My Applications</Link><Link className="btn-refresh" to="/products">Product Catalog</Link></nav></div>;

  return <div className="application-form-page">
    <Link to={`/products/${productId}`} className="btn-refresh"><ArrowLeft size={15} /> Back to product</Link>
    {error && <div className="inventory-alert error">{error}</div>}
    <div className="application-form-layout">
      <aside className="card application-product-summary"><span className="tech-tag">{product?.category_name}</span><h2>{product?.name}</h2><p>SKU: {product?.sku}</p><p>{product?.description}</p><div className="offline-note"><strong>Store application only</strong><span>No online payment is collected. Availability is rechecked when the unit is released.</span></div></aside>
      <section className="card application-form-card"><h1><ClipboardPen size={25} /> Start Application</h1><form onSubmit={submit}>
        <label>Transaction branch<select required style={inputStyle} value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}><option value="">Select branch</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <ShieldAlert size={18} /> Identity Information
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Information is collected securely for store transaction processing.</p>
          
          <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label>Customer name<input required maxLength="255" style={inputStyle} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
            <label>Birth Date<input required type="date" style={inputStyle} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></label>
            <label>ID Type<input required maxLength="100" style={inputStyle} value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })} placeholder="e.g. Driver's License" /></label>
            <label>ID Number<input required maxLength="100" style={inputStyle} value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></label>
            <label>ID Expiration Date<input type="date" style={inputStyle} value={form.id_expiration_date} onChange={(e) => setForm({ ...form, id_expiration_date: e.target.value })} /></label>
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" style={checkboxStyle} checked={form.uses_barangay_clearance} onChange={(e) => setForm({ ...form, uses_barangay_clearance: e.target.checked })} />
            Uses Barangay Clearance
          </label>
          
          {form.uses_barangay_clearance && (
            <div className="responsive-form-row nested-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <label>Clearance Reference<input required maxLength="100" style={inputStyle} value={form.barangay_clearance_reference} onChange={(e) => setForm({ ...form, barangay_clearance_reference: e.target.value })} /></label>
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
                <label>Guardian Name<input required maxLength="255" style={inputStyle} value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} /></label>
              </div>
              <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <label>Guardian ID Type<input required maxLength="100" style={inputStyle} value={form.guardian_id_type} onChange={(e) => setForm({ ...form, guardian_id_type: e.target.value })} /></label>
                <label>Guardian ID Number<input required maxLength="100" style={inputStyle} value={form.guardian_id_number} onChange={(e) => setForm({ ...form, guardian_id_number: e.target.value })} /></label>
              </div>
            </div>
          )}
        </div>

        <label>Contact number<input required minLength="7" maxLength="50" style={inputStyle} value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} /></label>
        <label>Address<textarea required maxLength="500" rows="3" style={inputStyle} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        <label>Quantity<input required min="1" step="1" type="number" style={inputStyle} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
        <label>Purpose / transaction intent<textarea required maxLength="500" rows="2" style={inputStyle} placeholder="Briefly describe your intended transaction" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></label>
        <label>Notes (optional)<textarea maxLength="1000" rows="3" style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        <button className="btn-refresh primary" disabled={submitting} style={{ marginTop: '1rem' }}>{submitting ? 'Submitting…' : 'Submit Application'}</button>
      </form></section>
    </div>
  </div>;
}
export default ApplicationFormPage;
