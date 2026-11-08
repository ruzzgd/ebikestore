import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Tag, CarFront, Package, ArrowRight, RefreshCw } from 'lucide-react';
import productService from '../../services/productService.js';
import categoryService from '../../services/categoryService.js';
import ErrorModal from '../../components/ErrorModal.jsx';
import Pagination from '../../components/Pagination.jsx';

export function ProductsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAccountCatalog = location.pathname.startsWith('/account/products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const initialCategory = Number(searchParams.get('category')) || null;
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

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

  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId) nextParams.set('category', String(categoryId));
    else nextParams.delete('category');
    setSearchParams(nextParams, { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  const getImageUrl = (imageKey) => {
    if (!imageKey) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/uploads/images/${imageKey}`;
  };

  const availabilityLabels = { available: 'Available', limited_stock: 'Limited Stock', out_of_stock: 'Out of Stock' };

  const getStockStatus = (prod) => {
    const stock = Number(prod.total_stock ?? 0);
    if (stock >= 10) {
      return { label: `Full Stock (${stock} units)`, className: 'available' };
    }
    if (stock > 0) {
      return { label: `Low Stock (${stock} unit${stock === 1 ? '' : 's'})`, className: 'limited_stock' };
    }
    return { label: 'Out of Stock (0 units)', className: 'out_of_stock' };
  };

  return (
    <div className="container product-catalog-page" style={{ paddingBottom: '4rem' }}>
      {/* Header Banner */}
      <div className="catalog-hero" style={{ textAlign: 'center', marginBottom: '3.5rem', background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', padding: '3rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: '700', marginBottom: '1rem', letterSpacing: '-0.02em', color: '#0f172a' }}>Product Catalog</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>
          Explore Fidelo E-Bikes, replacement spare parts, and riding accessories.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="catalog-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem', padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => selectCategory(null)}
            className={`btn ${selectedCategory === null ? 'primary' : 'secondary'}`}
            id="btn-filter-category-all"
          >
            <span>All Categories</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`btn ${selectedCategory === cat.id ? 'primary' : 'secondary'}`}
              id={`btn-filter-category-${cat.id}`}
            >
              <span>{cat.name} ({Number(cat.active_product_count || 0)})</span>
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
            {selectedCategory
              ? `No ${categories.find((category) => category.id === selectedCategory)?.name || 'products'} are currently available.`
              : 'Try refining your search keywords.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid-cols-3">
            {paginatedProducts.map((prod) => {
              const imageUrl = getImageUrl(prod.image_key);
              const status = getStockStatus(prod);
              const isOutOfStock = prod.availability === 'out_of_stock' || Number(prod.total_stock ?? 0) <= 0;
              return (
                <div
                  key={prod.id}
                  className="card catalog-product-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minWidth: 0,
                    padding: '1.25rem',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
                >
                  {/* Image Box */}
                  <div className="catalog-product-image" style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <CarFront size={48} color="#94a3b8" />
                    )}
                  </div>

                  {/* Product Metadata */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                    <span className="tech-tag" style={{ background: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-brand-light)', border: 'none', fontWeight: '500' }}>{prod.category_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontWeight: '500', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      SKU: {prod.sku}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      lineHeight: '1.35',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      minHeight: '2.7em'
                    }}
                    title={prod.name}
                  >
                    {prod.name}
                  </h3>
                  
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      minHeight: '2.4em'
                    }}
                  >
                    {prod.description || 'No description provided.'}
                  </p>

                  <div className="product-card-badge-container" style={{ marginBottom: '1rem', flexShrink: 0, marginTop: 'auto' }}>
                    {prod.available_colors && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {prod.available_colors.split(',').map((c, i) => (
                          <span key={i} className="tech-tag" style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}>
                            {c.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className={`availability-badge ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Price & Action */}
                  <div className="catalog-product-action" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a' }}>
                      {formatCurrency(prod.unit_price)}
                    </span>
                    <div className="catalog-card-actions">
                      <Link to={`${isAccountCatalog ? '/account/products' : '/products'}/${prod.id}`} className="btn secondary" style={{ fontSize: '0.85rem' }} id={`link-product-detail-${prod.id}`}>
                        <span>View Details</span>
                        <ArrowRight size={14} />
                      </Link>
                      {isOutOfStock
                        ? <button className="btn primary" disabled>Out of Stock</button>
                        : <Link to={`/products/${prod.id}/apply`} className="btn primary" id={`link-buy-product-${prod.id}`}>Buy</Link>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            currentPage={page}
            totalItems={products.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
      <ErrorModal isOpen={Boolean(error)} message={error} onClose={() => setError('')} />
    </div>
  );
}

export default ProductsPage;
