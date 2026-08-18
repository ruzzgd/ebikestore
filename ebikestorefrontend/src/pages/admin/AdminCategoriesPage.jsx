import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Plus, Edit2, CheckCircle, XCircle, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import categoryService from '../../services/categoryService.js';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({ id: null, name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await categoryService.getCategories(false);
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await categoryService.updateCategory(formData.id, { name: formData.name, description: formData.description });
        setSuccess(`Category '${formData.name}' updated successfully!`);
      } else {
        await categoryService.createCategory({ name: formData.name, description: formData.description });
        setSuccess(`Category '${formData.name}' created successfully!`);
      }
      setFormData({ id: null, name: '', description: '' });
      setIsEditing(false);
      loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setFormData({ id: cat.id, name: cat.name, description: cat.description || '' });
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleToggleActive = async (id, currentStatus) => {
    const category = categories.find((item) => item.id === id);
    if (currentStatus && Number(category?.active_product_count || 0) > 0) {
      setError(`Deactivate the ${category.active_product_count} active product${Number(category.active_product_count) === 1 ? '' : 's'} in '${category.name}' before deactivating this category.`);
      return;
    }
    try {
      await categoryService.toggleCategoryActive(id, !currentStatus);
      loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to update category status');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/admin" className="btn-refresh">
          <ArrowLeft size={16} />
          <span>Back to Admin Dashboard</span>
        </Link>
        <h2 style={{ fontSize: '1.75rem' }}>Category Management</h2>
      </div>

      <div className="grid-cols-2">
        {/* Form */}
        <div className="card">
          <h3>{isEditing ? 'Edit Category' : 'Create New Category'}</h3>
          
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

          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }} id="form-category">
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Category Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Electric Scooters"
                style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                id="input-category-name"
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief category description..."
                style={{ width: '100%', padding: '0.6rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.85rem', resize: 'vertical' }}
                id="input-category-description"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={submitting} className="btn-refresh primary" style={{ flex: 1, justifyContent: 'center' }} id="btn-save-category">
                <span>{submitting ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setFormData({ id: null, name: '', description: '' }); }}
                  className="btn-refresh"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Directory List */}
        <div className="card">
          <h3>Category Directory</h3>
          {loading ? (
            <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading categories...</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {categories.map((cat) => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{cat.name}</span>
                      {!cat.is_active && <span className="tech-tag" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>Inactive</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{cat.description || 'No description'} · {Number(cat.active_product_count || 0)} active product{Number(cat.active_product_count || 0) === 1 ? '' : 's'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => handleEdit(cat)} className="btn-refresh" title="Edit Category">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggleActive(cat.id, cat.is_active)} className="btn-refresh" title={cat.is_active ? 'Deactivate' : 'Activate'}>
                      {cat.is_active ? <XCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#10b981" />}
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

export default AdminCategoriesPage;
