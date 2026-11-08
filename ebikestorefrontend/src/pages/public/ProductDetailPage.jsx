import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CarFront, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import productService from '../../services/productService.js';
import { useAuth } from '../../hooks/useAuth.js';

export function ProductDetailPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAccountCatalog = location.pathname.startsWith('/account/products');
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'branch_staff' || user?.role === 'warehouse_staff';
  const backPath = isStaffOrAdmin ? '/admin/products' : isAccountCatalog ? '/account/products' : '/products';
  const backLabel = isStaffOrAdmin ? 'Back to Product Management' : 'Back to Products';

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const getImageUrl = (imageKey) => {
    if (!imageKey) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/uploads/images/${imageKey}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-light)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }} className="card">
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2>Product Not Available</h2>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 1.5rem 0' }}>{error}</p>
        <Link to={backPath} className="btn secondary" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const imageUrl = getImageUrl(product.image_key);
  const availabilityLabels = { available: 'Available', limited_stock: 'Limited Stock', out_of_stock: 'Out of Stock' };

  return (
    <div className="container public-product-detail" style={{ paddingBottom: '4rem' }}>
      <Link to={backPath} className="btn secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        <ArrowLeft size={16} />
        <span>{backLabel}</span>
      </Link>

      <div className="grid-cols-2" style={{ gap: '2.5rem' }}>
        {/* Left: Product Image */}
        <div className="card public-product-detail-image" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px', background: 'var(--color-bg-main)' }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <CarFront size={80} style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.85rem' }}>No Image Uploaded</p>
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="public-product-detail-copy" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="tech-tag" style={{ background: 'var(--color-bg-card-hover)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{product.category_name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>SKU: {product.sku}</span>
          </div>

          <h1 style={{ fontSize: '2.2rem', marginBottom: '1rem', lineHeight: '1.2', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{product.name}</h1>

          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-status-success)', marginBottom: '1.5rem' }}>
            {formatCurrency(product.unit_price)}
          </div>

          {product.available_colors && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Available Colors</h4>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {product.available_colors.split(',').map((color, index) => (
                  <span key={index} className="tech-tag" style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem' }}>
                    {color.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Description</h4>
            <p style={{ color: 'var(--color-text-primary)', lineHeight: '1.6' }}>
              {product.description || 'No detailed description available for this product.'}
            </p>
          </div>

          <div className="public-product-availability" style={{ padding: '0.85rem 1rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Availability by location</strong>
            <div className="public-location-list">
              {(product.availability_by_location || []).map((location) => (
                <div key={location.location_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ wordBreak: 'break-word' }}>{location.location_name}</span>
                  <span className={`availability-badge ${location.availability}`} style={{ flexShrink: 0 }}>{availabilityLabels[location.availability]}</span>
                </div>
              ))}
            </div>
          </div>
          {(!user || user.role === 'customer') && product.availability !== 'out_of_stock' && (
            <Link to={`/products/${product.id}/apply`} className="btn primary" style={{ marginTop: '1.5rem', width: 'max-content' }}>
              Start Application
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
