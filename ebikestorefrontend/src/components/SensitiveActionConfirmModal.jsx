import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalStyle = {
  background: 'var(--color-bg-elevated, #fff)',
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg, 8px)',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const inputStyle = {
  width: '100%', padding: '.65rem', background: 'var(--color-bg-main)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)', marginTop: '0.5rem', marginBottom: '1rem'
};

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'
};

export function SensitiveActionConfirmModal({ isOpen, onClose, onConfirm, title = "Confirm Action", message = "Please enter your password to confirm this action." }) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
    setPassword('');
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle} className="card">
        <div style={headerStyle}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} /> {title}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ marginBottom: '1rem' }}>{message}</p>
        <form onSubmit={handleSubmit}>
          <label>
            Password
            <input 
              type="password" 
              required 
              style={inputStyle} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              autoFocus
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-refresh" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-refresh primary">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SensitiveActionConfirmModal;
