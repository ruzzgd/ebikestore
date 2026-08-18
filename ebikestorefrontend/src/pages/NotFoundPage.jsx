import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <AlertTriangle size={64} color="#f59e0b" style={{ marginBottom: '1.5rem' }} />
      <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        The page or resource you requested does not exist in the Fidelo E-Bike Store system.
      </p>
      <Link to="/" className="btn-refresh" style={{ display: 'inline-flex', padding: '0.6rem 1.2rem' }}>
        <Home size={16} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}

export default NotFoundPage;
