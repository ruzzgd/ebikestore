import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, KeyRound, Lock, Mail } from 'lucide-react';
import authService from '../../services/authService.js';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', code: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestCode = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const result = await authService.requestPasswordReset({ email: form.email.trim() });
      setMessage(result.message); setStep(2);
    } catch (err) { setError(err.message || 'Unable to request a reset code.'); }
    finally { setLoading(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const result = await authService.resetPassword({ email: form.email.trim(), code: form.code, password: form.password });
      navigate('/login', { replace: true, state: { verifiedMessage: result.message } });
    } catch (err) { setError(err.message || 'Unable to reset your password.'); }
    finally { setLoading(false); }
  };

  const field = (name, label, type, Icon, props = {}) => (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap"><Icon size={18} aria-hidden="true" />
        <input type={type} name={name} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required {...props} />
      </span>
    </label>
  );

  return (
    <div className="auth-page-container">
      <div className="auth-image-panel" aria-hidden="true">
        <img src="/images/fidelo-ebike-hero.jpg" alt="" />
        <div className="auth-image-overlay" />
        <div className="auth-image-content"><span className="eyebrow">ACCOUNT RECOVERY</span><h2>Get back on the road.</h2><p>Securely reset your password with a time-limited code sent to your email.</p></div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-card">
          <Link to="/login" className="auth-back"><ArrowLeft size={16} /> Back to sign in</Link>
          <div className="auth-card-heading"><div className="auth-icon"><KeyRound size={24} /></div><h1>{step === 1 ? 'Forgot password?' : 'Create a new password'}</h1><p>{step === 1 ? 'Enter the email connected to your account.' : `Enter the 6-digit code sent for ${form.email}.`}</p></div>
          {message && <div className="form-notice success"><CheckCircle size={17} />{message}</div>}
          {error && <div className="form-notice error">{error}</div>}
          {step === 1 ? <form onSubmit={requestCode} className="auth-form">
            {field('email', 'Email address', 'email', Mail, { placeholder: 'name@example.com', autoComplete: 'email' })}
            <button className="btn primary auth-submit" disabled={loading}>{loading ? 'Sending code…' : 'Send reset code'}</button>
          </form> : <form onSubmit={resetPassword} className="auth-form">
            {field('code', '6-digit reset code', 'text', KeyRound, { placeholder: '123456', inputMode: 'numeric', minLength: 6, maxLength: 6, pattern: '[0-9]{6}' })}
            {field('password', 'New password', 'password', Lock, { placeholder: 'At least 8 characters', minLength: 8, autoComplete: 'new-password' })}
            {field('confirmPassword', 'Confirm new password', 'password', Lock, { placeholder: 'Repeat new password', minLength: 8, autoComplete: 'new-password' })}
            <button className="btn primary auth-submit" disabled={loading}>{loading ? 'Updating password…' : 'Reset password'}</button>
            <button type="button" className="auth-text-button" onClick={() => { setStep(1); setMessage(''); }}>Use a different email</button>
          </form>}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
