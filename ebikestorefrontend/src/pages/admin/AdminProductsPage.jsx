import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CarFront, Eye, Edit2, CheckCircle, XCircle, ArrowLeft, RefreshCw, ImagePlus, Plus, X, Search } from 'lucide-react';
import productService from '../../services/productService.js';
import categoryService from '../../services/categoryService.js';
import uploadService from '../../services/uploadService.js';
import Pagination from '../../components/Pagination.jsx';
import ErrorModal from '../../components/ErrorModal.jsx';

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [formData, setFormData] = useState({
    id: null,
    categoryId: '',
    sku: '',
    name: '',
    description: '',
    unitPrice: '',
    imageKey: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodsData, catsData] = await Promise.all([
        productService.getProducts({ activeOnly: false }),
        categoryService.getCategories(true),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      if (catsData.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: catsData[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      const result = await uploadService.uploadProductImage(file);
      setFormData((prev) => ({ ...prev, imageKey: result.imageKey }));
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      setImagePreviewUrl(`${baseUrl}/uploads/images/${result.imageKey}`);
      setSuccess('Image uploaded to MinIO storage successfully!');
    } catch (err) {
      setError(err.message || 'Failed to upload product image');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      categoryId: categories.length > 0 ? categories[0].id : '',
      sku: '',
      name: '',
      description: '',
      unitPrice: '',
      imageKey: '',
    });
    setImagePreviewUrl('');
    setIsEditing(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (prod) => {
    setFormData({
      id: prod.id,
      categoryId: prod.category_id,
      sku: prod.sku,
      name: prod.name,
      description: prod.description || '',
      unitPrice: prod.unit_price,
      imageKey: prod.image_key || '',
    });
    if (prod.image_key) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      setImagePreviewUrl(`${baseUrl}/uploads/images/${prod.image_key}`);
    } else {
      setImagePreviewUrl('');
    }
    setIsEditing(true);
    setIsModalOpen(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await productService.updateProduct(formData.id, formData);
        setSuccess(`Product '${formData.name}' updated successfully!`);
      } else {
        await productService.createProduct(formData);
        setSuccess(`Product '${formData.name}' created successfully!`);
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await productService.toggleProductActive(id, !currentStatus);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to toggle product status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
      const matchesCat = !selectedCategory || String(p.category_id) === String(selectedCategory);
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  return (
    <div>
      <header className="management-heading product-management-heading">
        <div>
          <span className="section-eyebrow">CATALOG ADMINISTRATION</span>
          <h1>Product Management</h1>
          <p>Create, update, review, and control product availability across the Fidelo catalog.</p>
        </div>
        <div className="management-heading-actions">
          <Link to="/admin" className="btn-refresh">
            <ArrowLeft size={16} /><span>Back</span>
          </Link>
          <button type="button" className="btn-refresh primary" onClick={handleOpenCreate}>
            <Plus size={16} /><span>Create Product</span>
          </button>
          <button type="button" className="btn-refresh" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin-icon' : undefined} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-status-success)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', margin: '1rem 0', color: '#065f46', fontSize: '0.875rem' }}>
          {success}
        </div>
      )}

      {/* Toolbar */}
      <div className="inventory-toolbar card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '0.55rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          style={{ padding: '0.55rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', minWidth: '180px' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="inventory-summary">
          <CarFront size={18} /> {filteredProducts.length} product(s)
        </div>
      </div>

      {/* Full-width Product Directory */}
      <section className="card">
        <h3>Catalog Master List</h3>
        {loading ? (
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-text-muted)' }}>
            <RefreshCw className="spin-icon" size={24} style={{ marginBottom: '1rem' }} />
            <p>Loading catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <CarFront size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No products match your filters.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll" style={{ marginTop: '1rem' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        {p.description && (
                          <small style={{ display: 'block', color: 'var(--color-text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.description}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="tech-tag">{p.category_name}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{p.sku}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(p.unit_price)}</td>
                      <td>
                        <span className={`user-status-pill ${p.is_active ? 'active' : 'inactive'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link to={`/admin/products/${p.id}`} className="btn-refresh" title="View Product" aria-label={`View ${p.name}`}>
                            <Eye size={14} />
                          </Link>
                          <button onClick={() => handleEdit(p)} className="btn-refresh" title="Edit Product">
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            className="btn-refresh"
                            title={p.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {p.is_active ? <XCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#10b981" />}
                            {p.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={filteredProducts.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
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
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '12px',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                {isEditing ? 'Edit Product' : 'Create New Master Product'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} id="form-product">
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                  id="select-product-category"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. EBK-2026-X1"
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                    id="input-product-sku"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                    Unit Price (PHP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="25000.00"
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                    id="input-product-price"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fidelo Horizon E-Bike 500W"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                  id="input-product-name"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Technical specs, battery rating, features..."
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem', resize: 'vertical' }}
                  id="input-product-description"
                />
              </div>

              <div className="product-image-field" style={{ marginBottom: '1.25rem' }}>
                <span className="product-image-field-label">Product Image</span>
                <input className="product-image-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFileChange} id="input-product-image-file" />
                <label className={`product-image-dropzone ${imagePreviewUrl ? 'has-image' : ''}`} htmlFor="input-product-image-file">
                  {imagePreviewUrl ? <img src={imagePreviewUrl} alt="Selected product preview" /> : <span className="product-image-placeholder"><ImagePlus size={28} /><strong>Choose a product image</strong><small>JPEG, PNG, or WebP</small></span>}
                  <span className="product-image-overlay"><ImagePlus size={18} />{imagePreviewUrl ? 'Change image' : 'Browse image'}</span>
                  {uploadingImage && <span className="product-image-loading"><RefreshCw size={22} className="spin-icon" /> Uploading…</span>}
                </label>
                {imagePreviewUrl && <small className="product-image-help">Click preview to choose a different image.</small>}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="btn-refresh"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="btn-refresh primary"
                  id="btn-save-product"
                >
                  <span>{submitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={Boolean(error)}
        title="Product Error"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  );
}

export default AdminProductsPage;
