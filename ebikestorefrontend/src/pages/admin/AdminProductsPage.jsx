import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Upload, Plus, Edit2, CheckCircle, XCircle, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import productService from '../../services/productService.js';
import categoryService from '../../services/categoryService.js';
import uploadService from '../../services/uploadService.js';

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
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
    setError('');
    setSuccess('');
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/admin" className="btn-refresh">
          <ArrowLeft size={16} />
          <span>Back to Admin Dashboard</span>
        </Link>
        <h2 style={{ fontSize: '1.75rem' }}>Product Master Catalog Management</h2>
      </div>

      <div className="grid-cols-2">
        {/* Form */}
        <div className="card">
          <h3>{isEditing ? 'Edit Product' : 'Create New Master Product'}</h3>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-status-error)', padding: '0.65rem', borderRadius: 'var(--radius-md)', margin: '1rem 0', color: '#fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-status-success)', padding: '0.65rem', borderRadius: 'var(--radius-md)', margin: '1rem 0', color: '#6ee7b7', fontSize: '0.85rem' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }} id="form-product">
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Category</label>
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
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>SKU Code</label>
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
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Unit Price (PHP)</label>
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Product Name</label>
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
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Technical specs, battery rating, features..."
                style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem', resize: 'vertical' }}
                id="input-product-description"
              />
            </div>

            {/* MinIO Image Upload Box */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-brand-light)', fontWeight: '600', marginBottom: '0.5rem' }}>
                Product Image (MinIO Storage)
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}
                  id="input-product-image-file"
                />
                {uploadingImage && <RefreshCw size={16} className="spin-icon" />}
              </div>

              {imagePreviewUrl && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={imagePreviewUrl} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    Key: {formData.imageKey}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={submitting || uploadingImage} className="btn-refresh primary" style={{ flex: 1, justifyContent: 'center' }} id="btn-save-product">
                <span>{submitting ? 'Saving Product...' : isEditing ? 'Update Product' : 'Create Product'}</span>
              </button>

              {isEditing && (
                <button type="button" onClick={resetForm} className="btn-refresh">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Product Directory */}
        <div className="card">
          <h3>Catalog Master List</h3>
          {loading ? (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-text-muted)' }}>
              <RefreshCw className="spin-icon" size={24} style={{ marginBottom: '1rem' }} />
              <p>Loading catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Bike size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No products found in the catalog.</p>
              <p style={{ fontSize: '0.85rem' }}>Use the form to create a new product.</p>
            </div>
          ) : (
            <div style={{ marginTop: '1rem', maxHeight: '520px', overflowY: 'auto' }}>
              {products.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{p.name}</span>
                      <span className="tech-tag">{p.category_name}</span>
                      {!p.is_active && <span className="tech-tag" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>Inactive</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                      SKU: {p.sku} &bull; Price: {formatCurrency(p.unit_price)} {p.image_key ? '&bull; Image Linked' : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => handleEdit(p)} className="btn-refresh" title="Edit Product">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggleActive(p.id, p.is_active)} className="btn-refresh" title={p.is_active ? 'Deactivate' : 'Activate'}>
                      {p.is_active ? <XCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#10b981" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProductsPage;
