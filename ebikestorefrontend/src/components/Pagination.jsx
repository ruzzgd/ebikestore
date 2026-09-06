import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  style = {},
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('…');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('…');
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem 0.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary)',
        ...style,
      }}
      className="pagination-bar"
    >
      <div>
        Showing <strong style={{ color: 'var(--color-text-primary)' }}>{startItem}</strong> to{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>{endItem}</strong> of{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>{totalItems}</strong> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-refresh"
          style={{ padding: '0.4rem 0.6rem', minHeight: '32px' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === '…') {
            return (
              <span key={`ellipsis-${idx}`} style={{ padding: '0 0.3rem', color: 'var(--color-text-muted)' }}>
                …
              </span>
            );
          }
          const isActive = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              className={isActive ? 'btn-refresh primary' : 'btn-refresh'}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: isActive ? 600 : 400,
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-refresh"
          style={{ padding: '0.4rem 0.6rem', minHeight: '32px' }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
