import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Tag, Bike, Package, ArrowRight, RefreshCw } from 'lucide-react';
import productService from '../../services/productService.js';
import categoryService from '../../services/categoryService.js';

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catsData, prodsData] = await Promise.all([
        categoryService.getCategories(true),
        productService.getProducts({ category: selectedCategory, search: searchTerm, activeOnly: true }),
      ]);
      setCategories(catsData);
      setProducts(prodsData);
    } catch (err) {
      setError(err.message || 'Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const getImageUrl = (imageKey) => {
    if (!imageKey) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/uploads/images/${imageKey}`;
  };

  const availabilityLabels = { available: 'Available', limited_stock: 'Limited Stock', out_of_stock: 'Out of Stock' };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem', background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', padding: '3rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: '700', marginBottom: '1rem', letterSpacing: '-0.02em', color: '#0f172a' }}>Product Catalog</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>
          Explore Fidelo E-Bikes, replacement spare parts, and riding accessories.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem', padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn ${selectedCategory === null ? 'primary' : 'secondary'}`}
            id="btn-filter-category-all"
          >
            <span>All Categories</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn ${selectedCategory === cat.id ? 'primary' : 'secondary'}`}
              id={`btn-filter-category-${cat.id}`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or SKU..."
              style={{ padding: '0.65rem 1rem 0.65rem 2.75rem', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.95rem', width: '280px', transition: 'all 0.2s ease', outline: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              id="input-catalog-search"
            />
          </div>
          <button type="submit" className="btn primary" id="btn-catalog-search-submit">
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-light)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading catalog...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca' }}>
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Package size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
          <h3>No products found</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Try selecting a different category or refining your search keywords.
          </p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {products.map((prod) => {
            const imageUrl = getImageUrl(prod.image_key);
            return (
              <div key={prod.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              >
                {/* Image Box */}
                <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Bike size={48} color="#94a3b8" />
                  )}
                </div>

                {/* Product Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="tech-tag" style={{ background: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-brand-light)', border: 'none', fontWeight: '500' }}>{prod.category_name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontWeight: '500', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    SKU: {prod.sku}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>{prod.name}</h3>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {prod.description || 'No description provided.'}
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <span className={`availability-badge ${prod.availability}`}>
                    {availabilityLabels[prod.availability] || 'Out of Stock'}
                  </span>
                </div>

                {/* Price & Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a' }}>
                    {formatCurrency(prod.unit_price)}
                  </span>
                  <Link to={`/products/${prod.id}`} className="btn primary" style={{ fontSize: '0.85rem' }} id={`link-product-detail-${prod.id}`}>
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
