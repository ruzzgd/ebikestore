import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ClipboardList, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import requestService from '../../services/interBranchRequestService.js';
import locationService from '../../services/locationService.js';
import productService from '../../services/productService.js';

const inputStyle = { width: '100%', padding: '.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' };
const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', in_transit: 'In Transit', received: 'Received' };

export function TransferRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [requests, setRequests] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [sourceInventory, setSourceInventory] = useState([]);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ sourceLocationId: '', destinationLocationId: '', note: '', requestedDeliveryDate: '', reasonForTransfer: '', items: [{ productId: '', quantityRequested: 1 }] });

  const activeLocations = useMemo(() => locations.filter((location) => location.is_active), [locations]);
  const destinationId = isAdmin ? form.destinationLocationId : user?.location_id;
  const sourceOptions = activeLocations.filter((location) => String(location.id) !== String(destinationId));

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestData, locationData, productData] = await Promise.all([
        requestService.listRequests({ status: statusFilter }),
        locationService.getLocations(),
        productService.getProducts({ activeOnly: true }),
      ]);
      setRequests(requestData);
      setLocations(locationData);
      setProducts(productData);
    } catch (error) { setFeedback({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [statusFilter]);
  useEffect(() => {
    if (!form.sourceLocationId) { setSourceInventory([]); return; }
    requestService.getSourceInventory(form.sourceLocationId)
      .then(setSourceInventory)
      .catch((error) => setFeedback({ type: 'error', text: error.message }));
  }, [form.sourceLocationId]);

  const stockForProduct = (productId) => sourceInventory.find((item) => String(item.product_id) === String(productId));

  const updateItem = (index, field, value) => {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  };
  const addItem = () => setForm((current) => ({ ...current, items: [...current.items, { productId: '', quantityRequested: 1 }] }));
  const removeItem = (index) => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));

  const submitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', text: '' });
    try {
      const request = await requestService.createRequest({
        sourceLocationId: Number(form.sourceLocationId),
        destinationLocationId: Number(destinationId),
        note: form.note,
        requestedDeliveryDate: form.requestedDeliveryDate,
        reasonForTransfer: form.reasonForTransfer,
        items: form.items.map((item) => ({ productId: Number(item.productId), quantityRequested: Number(item.quantityRequested) })),
      });
      setFormOpen(false);
      navigate(`/transfers/${request.id}`);
    } catch (error) { setFeedback({ type: 'error', text: error.message }); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="inventory-heading"><div><h1>Inter-Branch Transfers</h1><p>Request and trace stock between Fidelo operating locations.</p></div><div className="management-heading-actions"><button className="btn-refresh primary" onClick={() => setFormOpen(true)}><Plus size={15} /> New Unit Request</button><button className="btn-refresh" onClick={loadData}><RefreshCw size={15} /> Refresh</button></div></div>
      {feedback.text && <div className={`inventory-alert ${feedback.type}`}>{feedback.text}</div>}
      {formOpen && <div className="request-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="unit-request-title">
        <section className="card transfer-form-card request-modal">
          <button type="button" className="request-modal-close" onClick={() => setFormOpen(false)} aria-label="Close request form">×</button>
          <div className="request-modal-header">
            <span className="request-modal-icon"><Plus size={22} /></span>
            <div><span className="section-eyebrow">BRANCH INVENTORY</span><h2 id="unit-request-title">New Unit Request</h2><p>Request available products from another Fidelo location.</p></div>
          </div>
          <form onSubmit={submitRequest}>
            {isAdmin ? <label>Destination<select required style={inputStyle} value={form.destinationLocationId} onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value, sourceLocationId: '' })}><option value="">Select destination</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label> : <div className="fixed-location"><span>Destination</span><strong>{user?.location_name}</strong></div>}
            <label>Request stock from<select required style={inputStyle} value={form.sourceLocationId} onChange={(e) => setForm({ ...form, sourceLocationId: e.target.value })}><option value="">Select source</option>{sourceOptions.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <div className="request-items-heading"><strong>Requested items</strong><button type="button" className="btn-refresh" onClick={addItem}><Plus size={14} /> Add item</button></div>
            {form.items.map((item, index) => {
              const selectedElsewhere = new Set(form.items.filter((_, itemIndex) => itemIndex !== index).map((entry) => String(entry.productId)));
              return <div className="request-item-row" key={index}>
                <select required style={inputStyle} value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)}><option value="">Select product</option>{products.filter((product) => !selectedElsewhere.has(String(product.id))).map((product) => { const stock = stockForProduct(product.id); const quantity = Number(stock?.quantity || 0); return <option key={product.id} value={product.id} disabled={!form.sourceLocationId || quantity <= 0}>{product.name} ({product.sku}) — {form.sourceLocationId ? `${quantity} available${quantity <= 0 ? ' / OUT OF STOCK' : ''}` : 'select source first'}</option>; })}</select>
                <input required type="number" min="1" max={stockForProduct(item.productId)?.quantity || undefined} step="1" style={inputStyle} value={item.quantityRequested} onChange={(e) => updateItem(index, 'quantityRequested', e.target.value)} aria-label="Requested quantity" />
                <button type="button" disabled={form.items.length === 1} onClick={() => removeItem(index)} title="Remove item"><Trash2 size={17} /></button>
              </div>;
            })}
            <label>Requested Delivery Date<input required type="date" style={inputStyle} value={form.requestedDeliveryDate} onChange={(e) => setForm({ ...form, requestedDeliveryDate: e.target.value })} min={new Date().toISOString().split('T')[0]} /></label>
            <label>Reason for Transfer<input type="text" maxLength="500" style={inputStyle} value={form.reasonForTransfer} onChange={(e) => setForm({ ...form, reasonForTransfer: e.target.value })} /></label>
            <label>Request note (optional)<textarea rows="3" maxLength="1000" style={inputStyle} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            <button className="btn-refresh primary" disabled={submitting} type="submit">{submitting ? 'Creating…' : 'Create pending request'}</button>
          </form>
        </section>
      </div>}

        <section className="card transfer-list-card">
          <div className="movement-header"><h2><ClipboardList size={21} /> Request History</h2><select style={inputStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          {loading ? <p>Loading requests…</p> : requests.length === 0 ? <p className="muted">No requests match this filter.</p> : <div className="transfer-list">{requests.map((request) => (
            <Link className="transfer-list-row" key={request.id} to={`/transfers/${request.id}`}>
              <div><strong>{request.request_reference}</strong><span>{request.source_location_name} <ArrowRight size={13} /> {request.destination_location_name}</span><small>{request.item_count} item{Number(request.item_count) === 1 ? '' : 's'}</small></div>
              <div><span className={`request-status ${request.status}`}>{STATUS_LABELS[request.status]}</span><small>{request.requested_by_name} · {new Date(request.requested_at).toLocaleDateString()}</small></div>
            </Link>
          ))}</div>}
        </section>
    </div>
  );
}

export default TransferRequestsPage;
