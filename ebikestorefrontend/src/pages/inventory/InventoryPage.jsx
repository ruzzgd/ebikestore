import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, ArchiveRestore, ArrowDownCircle, ArrowUpCircle, Edit2, History, Package, RefreshCw, ShoppingBag, X, ImagePlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import inventoryService from '../../services/inventoryService.js';
import stockMovementService from '../../services/stockMovementService.js';
import productService from '../../services/productService.js';
import locationService from '../../services/locationService.js';
import uploadService from '../../services/uploadService.js';
import Pagination from '../../components/Pagination.jsx';
import ErrorModal from '../../components/ErrorModal.jsx';

const LABELS = { available: 'Available', limited_stock: 'Limited Stock', out_of_stock: 'Out of Stock' };
const inputStyle = { width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' };

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEditProduct = isAdmin || user?.role === 'branch_staff' || user?.role === 'warehouse_staff';
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

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    threshold: 0,
    productName: '',
    sku: '',
    unitPrice: '',
    imageKey: '',
    adjustType: 'none',
    adjustQuantity: '',
    adjustNote: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Pagination states (10 items per page limit)
  const [inventoryPage, setInventoryPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const PAGE_SIZE = 10;

  const effectiveLocation = locationFilter;
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
      const requests = [inventoryService.getInventory(filters), stockMovementService.getMovements(movementFilters), productService.getProducts({ activeOnly: true }), locationService.getLocations()];
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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData({ preserveMessage: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

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

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      threshold: item.low_stock_threshold ?? 0,
      productName: item.product_name || '',
      sku: item.sku || '',
      unitPrice: item.unit_price || '',
      imageKey: item.image_key || '',
      adjustType: 'none',
      adjustQuantity: '',
      adjustNote: '',
    });
    setImagePreviewUrl(getImageUrl(item.image_key) || '');
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditSaving(false);
    setImagePreviewUrl('');
    setUploadingImage(false);
  };

  const handleModalImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please select a valid JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB.');
      return;
    }
    setUploadingImage(true);
    setErrorMessage('');
    try {
      const result = await uploadService.uploadProductImage(file);
      setEditForm((prev) => ({ ...prev, imageKey: result.imageKey }));
      setImagePreviewUrl(getImageUrl(result.imageKey));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveEditModal = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditSaving(true);
    try {
      // 1. Update threshold if changed
      if (Number(editForm.threshold) !== Number(editingItem.low_stock_threshold)) {
        await inventoryService.updateThreshold(editingItem.id, Number(editForm.threshold));
      }

      // 2. Update product if admin or authorized staff and changed
      if (canEditProduct) {
        const prodChanges = {};
        if (editForm.productName && editForm.productName !== editingItem.product_name) prodChanges.name = editForm.productName;
        if (editForm.sku && editForm.sku !== editingItem.sku) prodChanges.sku = editForm.sku;
        if (editForm.unitPrice !== '' && Number(editForm.unitPrice) !== Number(editingItem.unit_price)) prodChanges.unitPrice = Number(editForm.unitPrice);
        if (editForm.imageKey !== undefined && editForm.imageKey !== (editingItem.image_key || '')) prodChanges.imageKey = editForm.imageKey;
        if (Object.keys(prodChanges).length > 0) {
          await productService.updateProduct(editingItem.product_id, prodChanges);
        }
      }

      // 3. Stock adjustment if requested
      if (editForm.adjustType !== 'none' && Number(editForm.adjustQuantity) > 0) {
        const payload = {
          productId: editingItem.product_id,
          locationId: editingItem.location_id,
          quantity: Number(editForm.adjustQuantity),
          note: editForm.adjustNote || 'Manual inventory adjustment',
        };
        if (editForm.adjustType === 'increase') {
          await inventoryService.stockIn(payload);
        } else if (editForm.adjustType === 'decrease') {
          await inventoryService.stockOut(payload);
        }
      }

      setMessage({ type: 'success', text: `Inventory item '${editingItem.product_name}' updated successfully.` });
      closeEditModal();
      await loadData({ preserveMessage: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update inventory');
    } finally {
      setEditSaving(false);
    }
  };

  // Filtered inventory based on search term
  const filteredInventory = useMemo(() => {
    if (!search.trim()) return inventory;
    const term = search.toLowerCase().trim();
    return inventory.filter((item) =>
      item.product_name?.toLowerCase().includes(term) ||
      item.sku?.toLowerCase().includes(term) ||
      item.location_name?.toLowerCase().includes(term)
    );
  }, [inventory, search]);

  // Paginated data slices
  const paginatedInventory = useMemo(() => {
    const start = (inventoryPage - 1) * PAGE_SIZE;
    return filteredInventory.slice(start, start + PAGE_SIZE);
  }, [filteredInventory, inventoryPage]);

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
        <label>
          Location
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={inputStyle}>
            <option value="">All locations</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
        <label style={{ flex: 1, minWidth: '220px' }}>
          Search product
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setInventoryPage(1);
              }}
              style={{ ...inputStyle, paddingRight: search ? '2.2rem' : '0.6rem' }}
              placeholder="Filter by name, SKU, or location"
              id="input-inventory-search"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setInventoryPage(1); }}
                style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </label>
        <button className="btn-refresh" onClick={() => loadData()}>Apply filters</button>
        <div className="inventory-summary">
          <Package size={18} /> {filteredInventory.length} {showArchived ? 'archived' : 'active'} records
          {!showArchived && (
            <> · <AlertTriangle size={18} /> {filteredInventory.filter((item) => item.is_low_stock).length} low stock</>
          )}
        </div>
      </div>

      <div className="inventory-layout">
        <section className="card inventory-table-card">
          <h2>{showArchived ? 'Archived Records' : 'Current Stock'}</h2>
          {loading ? (
            <p>Loading inventory…</p>
          ) : filteredInventory.length === 0 ? (
            <p className="muted">
              {search
                ? `No products match "${search}". Try clearing the search.`
                : showArchived
                ? 'No archived inventory records found.'
                : 'No stock records are configured for these filters. Use stock-in to establish initial stock.'}
            </p>
          ) : (
            <>
              <div className="inventory-card-grid">
                {paginatedInventory.map((item) => (
                  <article className={`inventory-product-card ${item.is_low_stock ? 'low-stock' : ''} ${item.quantity <= 0 ? 'zero-stock' : ''}`} key={item.id}>
                    <div className="inventory-product-image">
                      {getImageUrl(item.image_key) ? <img src={getImageUrl(item.image_key)} alt={item.product_name} /> : <Package size={36} />}
                    </div>
                    <div className="inventory-product-copy">
                      <small>{item.location_name}</small>
                      <h3 title={item.product_name}>{item.product_name}</h3>
                      <span className="muted">{item.sku}</span>
                      {item.available_colors && (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', margin: '0.35rem 0' }}>
                          {item.available_colors.split(',').map((c, idx) => (
                            <span key={idx} className="tech-tag" style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}>
                              {c.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="inventory-card-status">
                        <strong>{item.quantity} unit(s)</strong>
                        <span className={`availability-badge ${item.availability}`}>{LABELS[item.availability] || 'Out of Stock'}</span>
                      </div>
                      {!item.is_archived && (
                        <div className="threshold-control">
                          <input aria-label={`Threshold for ${item.product_name}`} type="number" min="0" value={thresholds[item.id] ?? 0} onChange={(e) => setThresholds({ ...thresholds, [item.id]: e.target.value })} />
                          <button onClick={() => saveThreshold(item)}>Save threshold</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn-refresh primary"
                          onClick={() => openEditModal(item)}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-refresh"
                          onClick={() => toggleArchive(item)}
                          style={{ flex: 1, justifyContent: 'center' }}
                          title={item.is_archived ? 'Restore to Active' : 'Move to Archive'}
                        >
                          {item.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                          {item.is_archived ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <Pagination
                currentPage={inventoryPage}
                totalItems={filteredInventory.length}
                pageSize={PAGE_SIZE}
                onPageChange={setInventoryPage}
              />
            </>
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

      {/* Edit Inventory Modal */}
      {editingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                  Edit Inventory Record
                </h3>
                <small style={{ color: '#64748b' }}>
                  {editingItem.product_name} · {editingItem.location_name}
                </small>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEditModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'var(--color-bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Stock</span>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{editingItem.quantity} unit(s)</div>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Location</span>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{editingItem.location_name}</div>
                </div>
              </div>

              {canEditProduct && (
                <>
                  <label>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Product Name</span>
                    <input
                      style={inputStyle}
                      value={editForm.productName}
                      onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                      required
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>SKU</span>
                      <input
                        style={inputStyle}
                        maxLength={30}
                        value={editForm.sku}
                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Unit Price (₱)</span>
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.unitPrice}
                        onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                      />
                    </label>
                  </div>

                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Product Image
                    </span>
                    <input
                      id="input-inventory-product-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleModalImageFileChange}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="input-inventory-product-image"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--color-bg-card-hover)',
                        border: '1px dashed var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                      }}
                    >
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Product preview"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                        />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <ImagePlus size={22} />
                        </div>
                      )}
                      <div style={{ flex: 1, fontSize: '0.85rem' }}>
                        <strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>
                          {imagePreviewUrl ? 'Change product image' : 'Upload product image'}
                        </strong>
                        <small style={{ color: 'var(--color-text-secondary)' }}>JPEG, PNG, or WebP (max 5MB)</small>
                      </div>
                      {uploadingImage && <RefreshCw size={18} className="spin-icon" />}
                    </label>
                  </div>
                </>
              )}

              <label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Low-Stock Alert Threshold
                </span>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={editForm.threshold}
                  onChange={(e) => setEditForm({ ...editForm, threshold: e.target.value })}
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                  Alerts trigger when inventory falls to or below this amount.
                </small>
              </label>

              <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <legend style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', padding: '0 0.4rem' }}>
                  Stock Adjustment (Optional)
                </legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Action</span>
                    <select
                      style={inputStyle}
                      value={editForm.adjustType}
                      onChange={(e) => setEditForm({ ...editForm, adjustType: e.target.value })}
                    >
                      <option value="none">No adjustment</option>
                      <option value="increase">Stock In (+)</option>
                      <option value="decrease">Stock Out (-)</option>
                    </select>
                  </label>
                  {editForm.adjustType !== 'none' && (
                    <label>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Quantity</span>
                      <input
                        style={inputStyle}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={editForm.adjustQuantity}
                        onChange={(e) => setEditForm({ ...editForm, adjustQuantity: e.target.value })}
                      />
                    </label>
                  )}
                </div>
                {editForm.adjustType !== 'none' && (
                  <label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Adjustment Note / Reason</span>
                    <input
                      style={inputStyle}
                      placeholder="e.g. Discrepancy recount, damaged unit, etc."
                      value={editForm.adjustNote}
                      onChange={(e) => setEditForm({ ...editForm, adjustNote: e.target.value })}
                    />
                  </label>
                )}
              </fieldset>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-refresh"
                  onClick={closeEditModal}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-refresh primary"
                  disabled={editSaving}
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
