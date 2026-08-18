import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, History, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import inventoryService from '../../services/inventoryService.js';
import stockMovementService from '../../services/stockMovementService.js';
import productService from '../../services/productService.js';
import locationService from '../../services/locationService.js';

const LABELS = { available: 'Available', limited_stock: 'Limited Stock', out_of_stock: 'Out of Stock' };
const inputStyle = { width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' };

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('');
  const [operation, setOperation] = useState({ type: 'stock_in', productId: '', locationId: '', quantity: '', note: '' });
  const [thresholds, setThresholds] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const effectiveLocation = isAdmin ? locationFilter : user?.location_id;
  const selectedInventory = useMemo(() => inventory.find((item) =>
    String(item.product_id) === String(operation.productId) &&
    String(item.location_id) === String(isAdmin ? operation.locationId : user?.location_id)),
  [inventory, operation.productId, operation.locationId, isAdmin, user?.location_id]);

  const loadData = async ({ preserveMessage = false } = {}) => {
    setLoading(true);
    if (!preserveMessage) setMessage({ type: '', text: '' });
    try {
      const filters = { locationId: effectiveLocation || '', search };
      const movementFilters = { locationId: effectiveLocation || '', type: movementType, limit: 100 };
      const requests = [inventoryService.getInventory(filters), stockMovementService.getMovements(movementFilters), productService.getProducts({ activeOnly: true })];
      if (isAdmin) requests.push(locationService.getLocations());
      const [inventoryData, movementData, productData, locationData = []] = await Promise.all(requests);
      setInventory(inventoryData);
      setMovements(movementData);
      setProducts(productData);
      setLocations(locationData.filter((location) => location.is_active));
      setThresholds(Object.fromEntries(inventoryData.map((item) => [item.id, item.low_stock_threshold])));
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to load inventory' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [locationFilter, movementType]);

  const submitOperation = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        productId: Number(operation.productId),
        locationId: Number(isAdmin ? operation.locationId : user.location_id),
        quantity: Number(operation.quantity), note: operation.note,
      };
      if (operation.type === 'stock_out') await inventoryService.stockOut(payload);
      else await inventoryService.stockIn(payload);
      setMessage({ type: 'success', text: `${operation.type === 'stock_in' ? 'Stock-in' : 'Stock-out'} recorded with its movement ledger entry.` });
      setOperation((current) => ({ ...current, quantity: '', note: '' }));
      await loadData({ preserveMessage: true });
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setSubmitting(false); }
  };

  const saveThreshold = async (item) => {
    try {
      await inventoryService.updateThreshold(item.id, Number(thresholds[item.id]));
      setMessage({ type: 'success', text: `Low-stock threshold updated for ${item.product_name}.` });
      await loadData({ preserveMessage: true });
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  };

  return (
    <div>
      <div className="inventory-heading">
        <div><h1>Inventory Management</h1><p>{isAdmin ? 'All operating locations' : user?.location_name || 'Assigned location'} · transaction-backed stock control</p></div>
        <button className="btn-refresh" onClick={loadData}><RefreshCw size={15} /> Refresh</button>
      </div>
      {message.text && <div className={`inventory-alert ${message.type}`}>{message.text}</div>}

      <div className="inventory-toolbar card">
        {isAdmin && <label>Location<select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={inputStyle}><option value="">All locations</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
        <label>Search product<input value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} placeholder="Name or SKU" /></label>
        <button className="btn-refresh" onClick={loadData}>Apply filters</button>
        <div className="inventory-summary"><Package size={18} /> {inventory.length} configured records · <AlertTriangle size={18} /> {inventory.filter((item) => item.is_low_stock).length} low stock</div>
      </div>

      <div className="inventory-layout">
        <section className="card inventory-table-card">
          <h2>Current Stock</h2>
          {loading ? <p>Loading inventory…</p> : inventory.length === 0 ? <p className="muted">No stock records are configured for these filters. Use stock-in to establish initial stock.</p> : (
            <div className="table-scroll"><table className="inventory-table"><thead><tr><th>Product</th><th>Location</th><th>Quantity</th><th>Status</th><th>Threshold</th></tr></thead><tbody>
              {inventory.map((item) => <tr key={item.id}><td><strong>{item.product_name}</strong><small>{item.sku}</small></td><td>{item.location_name}</td><td className="quantity-cell">{item.quantity}</td><td><span className={`availability-badge ${item.availability}`}>{LABELS[item.availability]}</span></td><td><div className="threshold-control"><input type="number" min="0" value={thresholds[item.id] ?? 0} onChange={(e) => setThresholds({ ...thresholds, [item.id]: e.target.value })} /><button onClick={() => saveThreshold(item)}>Save</button></div></td></tr>)}
            </tbody></table></div>
          )}
        </section>

        <aside className="card stock-operation-card">
          <h2>{operation.type === 'stock_in' ? <ArrowUpCircle size={21} /> : <ArrowDownCircle size={21} />} Stock Operation</h2>
          <form onSubmit={submitOperation}>
            <label>Operation<select style={inputStyle} value={operation.type} onChange={(e) => setOperation({ ...operation, type: e.target.value })}><option value="stock_in">Stock In</option><option value="stock_out">Stock Out</option></select></label>
            <label>Product<select required style={inputStyle} value={operation.productId} onChange={(e) => setOperation({ ...operation, productId: e.target.value })}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select></label>
            {isAdmin ? <label>Location<select required style={inputStyle} value={operation.locationId} onChange={(e) => setOperation({ ...operation, locationId: e.target.value })}><option value="">Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label> : <div className="fixed-location"><span>Fixed location</span><strong>{user?.location_name}</strong></div>}
            {operation.type === 'stock_out' && <div className="current-quantity">Current quantity: <strong>{selectedInventory?.quantity ?? 0}</strong></div>}
            <label>Quantity<input required type="number" min="1" step="1" style={inputStyle} value={operation.quantity} onChange={(e) => setOperation({ ...operation, quantity: e.target.value })} /></label>
            <label>Note (optional)<textarea maxLength="1000" rows="3" style={inputStyle} value={operation.note} onChange={(e) => setOperation({ ...operation, note: e.target.value })} /></label>
            <button disabled={submitting} className="btn-refresh primary" type="submit">{submitting ? 'Recording…' : 'Confirm operation'}</button>
          </form>
        </aside>
      </div>

      <section className="card movement-section">
        <div className="movement-header"><h2><History size={21} /> Movement History</h2><select value={movementType} onChange={(e) => setMovementType(e.target.value)} style={inputStyle}><option value="">All types</option><option value="stock_in">Stock In</option><option value="stock_out">Stock Out</option><option value="adjustment_in">Adjustment In</option><option value="adjustment_out">Adjustment Out</option></select></div>
        <div className="table-scroll"><table className="inventory-table"><thead><tr><th>Timestamp</th><th>Product</th><th>Location</th><th>Type</th><th>Moved</th><th>Before → After</th><th>Performed by</th><th>Note / Reference</th></tr></thead><tbody>
          {movements.map((movement) => <tr key={movement.id}><td>{new Date(movement.created_at).toLocaleString()}</td><td>{movement.product_name}<small>{movement.sku}</small></td><td>{movement.location_name}</td><td><span className={`movement-badge ${movement.type}`}>{movement.type.replace('_', ' ')}</span></td><td>{movement.quantity}</td><td>{movement.quantity_before} → {movement.quantity_after}</td><td>{movement.performed_by_name}</td><td>{movement.note || '—'}{(movement.request_reference || movement.application_reference) && <small>Reference: {movement.request_reference || movement.application_reference}</small>}</td></tr>)}
          {!loading && movements.length === 0 && <tr><td colSpan="8" className="muted">No movement history matches these filters.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}

export default InventoryPage;
