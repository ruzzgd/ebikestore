import React from 'react';
import { UserCheck, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Link } from 'react-router-dom';

export function CustomerAccount() {
  const { user } = useAuth();

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <UserCheck size={32} color="#10b981" />
        <h2>Customer Account Profile</h2>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Full Name:</span>
          <strong>{user?.name}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Email Address:</span>
          <strong>{user?.email}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Role:</span>
          <span className="tech-tag">{user?.role}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Email Verification:</span>
          <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: 650 }}>
            <CheckCircle2 size={16} /> Verified
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '.75rem', flexWrap: 'wrap' }}><Link className="btn-refresh primary" to="/account/applications">My Applications</Link><Link className="btn-refresh" to="/products">Browse Products</Link></div>
    </div>
  );
}

export default CustomerAccount;
