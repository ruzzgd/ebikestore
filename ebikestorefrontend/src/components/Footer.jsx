import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" style={{ borderTop: '1px solid var(--color-border)', background: '#f8fafc', paddingTop: '4rem', paddingBottom: '2rem' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem', textAlign: 'left' }}>
        <div style={{ maxWidth: '300px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a', letterSpacing: '-0.02em' }}>Fidelo E-Bike Store</h3>
          <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: '1.6' }}>
            Check availability, submit your application online, and complete your transaction in-store. Premium electric bicycles for the modern commute.
          </p>
        </div>
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <li><Link to="/" style={{ color: '#475569', textDecoration: 'none' }}>Home</Link></li>
            <li><Link to="/products" style={{ color: '#475569', textDecoration: 'none' }}>Shop E-Bikes</Link></li>
            <li><Link to="/contact" style={{ color: '#475569', textDecoration: 'none' }}>Contact Us</Link></li>
            <li><Link to="/terms" style={{ color: '#475569', textDecoration: 'none' }}>Terms of Service</Link></li>
            <li><Link to="/privacy" style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Account</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <li><Link to="/login" style={{ color: '#475569', textDecoration: 'none' }}>Sign In</Link></li>
            <li><Link to="/register" style={{ color: '#475569', textDecoration: 'none' }}>Create Account</Link></li>
            <li><Link to="/account" style={{ color: '#475569', textDecoration: 'none' }}>My Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#64748b' }}>
        <p>&copy; {currentYear} Fidelo E-Bike Store. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
