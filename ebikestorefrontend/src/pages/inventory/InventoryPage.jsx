import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, ArchiveRestore, ArrowDownCircle, ArrowUpCircle, History, Package, RefreshCw, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import inventoryService from '../../services/inventoryService.js';
import stockMovementService from '../../services/stockMovementService.js';
import productService from '../../services/productService.js';
import locationService from '../../services/locationService.js';
import Pagination from '../../components/Pagination.jsx';
import ErrorModal from '../../components/ErrorModal.jsx';

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
  const [showArchived, setShowArchived] = useState(false);
  const [operation, setOperation] = useState({ type: 'stock_in', productId: '', locationId: '', quantity: '', buyerName: '', note: '' });
  const [thresholds, setThresholds] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination states (10 items per page limit)
  const [inventoryPage, setInventoryPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const PAGE_SIZE = 10;

  const effectiveLocation = isAdmin ? locationFilter : user?.location_id;
  const selectedInventory = useMemo(() => inventory.find((item) =>
    String(item.product_id) === String(operation.productId) &&
    String(item.location_id) === String(isAdmin ? operation.locationId : user?.location_id)),
  [inventory, operation.productId, operation.locationId, isAdmin, user?.location_id]);

  const loadData = async ({ preserveMessage = false } = {}) => {
    setLoading(true);
    if (!preserveMessage) setMessage({ type: '', text: '' });
    try {
      const filters = { locationId: effectiveLocation || '', search, archived: showArchived };
      const movementFilters = { locationId: effectiveLocation || '', type: movementType, limit: 100 };
      const requests = [inventoryService.getInventory(filters), stockMovementService.getMovements(movementFilters), productService.getProducts({ activeOnly: true })];
      if (isAdmin) requests.push(locationService.getLocations());
      const [inventoryData, movementData, productData, locationData = []] = await Promise.all(requests);
      setInventory(inventoryData);
      setMovements(movementData);
      setProducts(productData);
      setLocations(locationData.filter((location) => location.is_active));
      setThresholds(Object.fromEntries(inventoryData.map((item) => [item.id, item.low_stock_threshold])));
      setInventoryPage(1);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load inventory');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [locationFilter, movementType, showArchived]);

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
      if (operation.type === 'walk_in_sale') await inventoryService.recordWalkInSale({ ...payload, buyerName: operation.buyerName });
      else if (operation.type === 'stock_out') await inventoryService.stockOut(payload);
      else await inventoryService.stockIn(payload);
      const operationLabel = operation.type === 'walk_in_sale' ? 'Walk-in sale' : operation.type === 'stock_in' ? 'Stock-in' : 'Stock-out';
      setMessage({ type: 'success', text: `${operationLabel} recorded with its movement ledger entry.` });
      setOperation((current) => ({ ...current, quantity: '', buyerName: '', note: '' }));
      await loadData({ preserveMessage: true });
    } catch (error) {
      setErrorMessage(error.message || 'Stock operation failed');
    } finally { setSubmitting(false); }
  };

  const toggleArchive = async (item) => {
    if (!item.is_archived && Number(item.quantity) > 0) {
      setErrorMessage(`Cannot archive '${item.product_name}': This item currently has ${item.quantity} unit(s) in stock. Only records with 0 stock can be moved to the archive.`);
      return;
    }
    try {
      await inventoryService.setArchivedState(item.id, !item.is_archived);
      setMessage({ type: 'success', text: `${item.product_name} inventory ${item.is_archived ? 'restored to active stock' : 'moved to archive'}.` });
      await loadData({ preserveMessage: true });
    } catch (error) {
      setErrorMessage(error.message || 'Archive operation failed');
    }
  };

  const getImageUrl = (imageKey) => imageKey ? `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/uploads/images/${imageKey}` : null;

  const saveThreshold = async (item) => {
    try {
      await inventoryService.updateThreshold(item.id, Number(thresholds[item.id]));
      setMessage({ type: 'success', text: `Low-stock threshold updated for ${item.product_name}.` });
      await loadData({ preserveMessage: true });
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update threshold');
    }
  };

  // Paginated data slices
  const paginatedInventory = useMemo(() => {
    const start = (inventoryPage - 1) * PAGE_SIZE;
    return inventory.slice(start, start + PAGE_SIZE);
  }, [inventory, inventoryPage]);

  const paginatedMovements = useMemo(() => {
    const start = (movementPage - 1) * PAGE_SIZE;
    return movements.slice(start, start + PAGE_SIZE);
  }, [movements, movementPage]);

  return (
    <div>
      <div className="inventory-heading">
        <div>
          <h1>Inventory Management</h1>
          <p>{isAdmin ? 'All operating locations' : user?.location_name || 'Assigned location'} · transaction-backed stock control</p>
        </div>
        <button className="btn-refresh" onClick={loadData}><RefreshCw size={15} /> Refresh</button>
      </div>

      {message.text && message.type === 'success' && (
        <div className={`inventory-alert ${message.type}`}>{message.text}</div>
      )}

      {!showArchived && inventory.some((item) => item.is_low_stock) && (
        <div className="inventory-alert low-stock-warning">
          <AlertTriangle size={18} /> {inventory.filter((item) => item.is_low_stock).length} item(s) need restocking. Zero-stock products require immediate attention.
        </div>
      )}

      {/* Archive Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          type="button"
          className={`btn ${!showArchived ? 'primary' : 'secondary'}`}
          onClick={() => setShowArchived(false)}
        >
          <Package size={16} /> Active Stock
        </button>
        <button
          type="button"
          className={`btn ${showArchived ? 'primary' : 'secondary'}`}
          onClick={() => setShowArchived(true)}
        >
          <Archive size={16} /> Archive Section
        </button>
      </div>

      <div className="inventory-toolbar card">
        {isAdmin && (
          <label>
            Location
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={inputStyle}>
              <option value="">All locations</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
        )}
        <label>
          Search product
          <input value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} placeholder="Name or SKU" />
        </label>
        <button className="btn-refresh" onClick={loadData}>Apply filters</button>
        <div className="inventory-summary">
          <Package size={18} /> {inventory.length} {showArchived ? 'archived' : 'active'} records
          {!showArchived && (
            <> · <AlertTriangle size={18} /> {inventory.filter((item) => item.is_low_stock).length} low stock</>
          )}
        </div>
      </div>

      <div className="inventory-layout">
        <section className="card inventory-table-card">
          <h2>{showArchived ? 'Archived Records' : 'Current Stock'}</h2>
          {loading ? (
            <p>Loading inventory…</p>
          ) : inventory.length === 0 ? (
            <p className="muted">
              {showArchived
                ? 'No archived inventory records found.'
                : 'No stock records are configured for these filters. Use stock-in to establish initial stock.'}
            </p>
          ) : (
            isAdmin ? (
              <>
                <div className="inventory-card-grid">
                  {paginatedInventory.map((item) => (
                    <article className={`inventory-product-card ${item.is_low_stock ? 'low-stock' : ''} ${item.quantity <= 0 ? 'zero-stock' : ''}`} key={item.id}>
                      <div className="inventory-product-image">
                        {getImageUrl(item.image_key) ? <img src={getImageUrl(item.image_key)} alt={item.product_name} /> : <Package size={36} />}
                      </div>
                      <div className="inventory-product-copy">
                        <small>{item.location_name}</small>
                        <h3>{item.product_name}</h3>
                        <span className="muted">{item.sku}</span>
                        <div className="inventory-card-status">
                          <strong>{item.quantity} unit(s)</strong>
                          <span className={`availability-badge ${item.availability}`}>{LABELS[item.availability]}</span>
                        </div>
                        {!item.is_archived && (
                          <div className="threshold-control">
                            <input aria-label={`Threshold for ${item.product_name}`} type="number" min="0" value={thresholds[item.id] ?? 0} onChange={(e) => setThresholds({ ...thresholds, [item.id]: e.target.value })} />
                            <button onClick={() => saveThreshold(item)}>Save threshold</button>
                          </div>
                        )}
                        <button
                          className="btn-refresh"
                          onClick={() => toggleArchive(item)}
                          style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                        >
                          {item.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                          {item.is_archived ? 'Restore to Active' : 'Move to Archive'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <Pagination
                  currentPage={inventoryPage}
                  totalItems={inventory.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setInventoryPage}
                />
              </>
            ) : (
              <>
                <div className="table-scroll">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Location</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Threshold</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInventory.map((item) => (
                        <tr className={item.is_low_stock ? 'low-stock-row' : ''} key={item.id}>
                          <td><strong>{item.product_name}</strong><small>{item.sku}</small></td>
                          <td>{item.location_name}</td>
                          <td className="quantity-cell">{item.quantity}</td>
                          <td><span className={`availability-badge ${item.availability}`}>{LABELS[item.availability]}</span></td>
                          <td>
                            <div className="threshold-control">
                              <input type="number" min="0" value={thresholds[item.id] ?? 0} onChange={(e) => setThresholds({ ...thresholds, [item.id]: e.target.value })} />
                              <button onClick={() => saveThreshold(item)}>Save</button>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn-refresh"
                              onClick={() => toggleArchive(item)}
                              title={item.is_archived ? 'Restore' : 'Archive'}
                            >
                              {item.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                              {item.is_archived ? 'Restore' : 'Archive'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={inventoryPage}
                  totalItems={inventory.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setInventoryPage}
                />
              </>
            )
          )}
        </section>

        {!showArchived && (
          <aside className="card stock-operation-card">
            <h2>{operation.type === 'stock_in' ? <ArrowUpCircle size={21} /> : operation.type === 'walk_in_sale' ? <ShoppingBag size={21} /> : <ArrowDownCircle size={21} />} Stock Operation</h2>
            <form onSubmit={submitOperation}>
              <label>Operation
                <select style={inputStyle} value={operation.type} onChange={(e) => setOperation({ ...operation, type: e.target.value })}>
                  <option value="stock_in">Stock In</option>
                  <option value="stock_out">Stock Out</option>
                  <option value="walk_in_sale">Walk-in Buyer</option>
                </select>
              </label>
              <label>Product
                <select required style={inputStyle} value={operation.productId} onChange={(e) => setOperation({ ...operation, productId: e.target.value })}>
                  <option value="">Select product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
                </select>
              </label>
              {isAdmin ? (
                <label>Location
                  <select required style={inputStyle} value={operation.locationId} onChange={(e) => setOperation({ ...operation, locationId: e.target.value })}>
                    <option value="">Select location</option>
                    {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                  </select>
                </label>
              ) : (
                <div className="fixed-location"><span>Fixed location</span><strong>{user?.location_name}</strong></div>
              )}
              {operation.type !== 'stock_in' && (
                <div className="current-quantity">Current quantity: <strong>{selectedInventory?.quantity ?? 0}</strong></div>
              )}
              {operation.type === 'walk_in_sale' && (
                <label>Buyer name / reference
                  <input required maxLength="255" style={inputStyle} value={operation.buyerName} onChange={(e) => setOperation({ ...operation, buyerName: e.target.value })} />
                </label>
              )}
              <label>Quantity
                <input required type="number" min="1" step="1" style={inputStyle} value={operation.quantity} onChange={(e) => setOperation({ ...operation, quantity: e.target.value })} />
              </label>
              <label>Note (optional)
                <textarea maxLength="1000" rows="3" style={inputStyle} value={operation.note} onChange={(e) => setOperation({ ...operation, note: e.target.value })} />
              </label>
              <button disabled={submitting} className="btn-refresh primary" type="submit">
                {submitting ? 'Recording…' : 'Confirm operation'}
              </button>
            </form>
          </aside>
        )}
      </div>

      <section className="card movement-section">
        <div className="movement-header">
          <h2><History size={21} /> Movement History</h2>
          <select value={movementType} onChange={(e) => setMovementType(e.target.value)} style={inputStyle}>
            <option value="">All types</option>
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="walk_in_sale">Walk-in Sale</option>
            <option value="adjustment_in">Adjustment In</option>
            <option value="adjustment_out">Adjustment Out</option>
          </select>
        </div>
        <div className="table-scroll">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Location</th>
                <th>Type</th>
                <th>Moved</th>
                <th>Before → After</th>
                <th>Performed by</th>
                <th>Note / Reference</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.map((movement) => (
                <tr key={movement.id}>
                  <td>{new Date(movement.created_at).toLocaleString()}</td>
                  <td>{movement.product_name}<small>{movement.sku}</small></td>
                  <td>{movement.location_name}</td>
                  <td><span className={`movement-badge ${movement.type}`}>{movement.type.replace('_', ' ')}</span></td>
                  <td>{movement.quantity}</td>
                  <td>{movement.quantity_before} → {movement.quantity_after}</td>
                  <td>{movement.performed_by_name}</td>
                  <td>{movement.note || '—'}{(movement.request_reference || movement.application_reference) && <small>Reference: {movement.request_reference || movement.application_reference}</small>}</td>
                </tr>
              ))}
              {!loading && movements.length === 0 && (
                <tr><td colSpan="8" className="muted">No movement history matches these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={movementPage}
          totalItems={movements.length}
          pageSize={PAGE_SIZE}
          onPageChange={setMovementPage}
        />
      </section>

      <ErrorModal
        isOpen={Boolean(errorMessage)}
        title="Inventory Action Error"
        message={errorMessage}
        onClose={() => setErrorMessage('')}
      />
    </div>
  );
}

export default InventoryPage;
