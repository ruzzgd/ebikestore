import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, CheckCircle, ArrowRight, KeyRound, RefreshCw } from 'lucide-react';
import authService from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';
import PasswordInput from '../../components/PasswordInput.jsx';
import ErrorModal from '../../components/ErrorModal.jsx';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Move to step 2 for verification
      setStep(2);
      setSuccess('');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.verifyEmail({ email: formData.email.trim(), code: formData.code.trim() });
      
      // Auto-login
      if (formData.password) {
        await login(formData.email, formData.password);
        navigate('/account', { replace: true, state: { isNew: true } });
      } else {
        navigate('/login', { state: { verifiedMessage: 'Email verified successfully. You can now sign in.' }});
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const result = await authService.resendVerification({ email: formData.email.trim() });
      setSuccess(result.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-image-panel">
        <img src="/images/fidelo-ebike-hero.jpg" alt="Fidelo E-Bike" />
        <div className="auth-image-overlay" />
        <div className="auth-image-content">
          <h2 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Join the Network.</h2>
          <p style={{ fontSize: '1.15rem', color: '#e2e8f0', lineHeight: 1.6, maxWidth: '85%' }}>Create an account to browse available inventory and streamline your e-bike purchase process.</p>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-card auth-card-modern" style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '16px', padding: '3rem 2.5rem', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
              {step === 1 ? 'Create an account' : 'Verify Email'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {step === 1 ? 'Join the Fidelo E-Bike Store' : `We sent a code to ${formData.email}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: step === 1 ? '#0f172a' : 'var(--color-text-muted)', fontWeight: step === 1 ? 600 : 400 }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step === 1 ? '#0f172a' : 'transparent', border: step === 1 ? 'none' : '1px solid currentColor', color: step === 1 ? '#ffffff' : 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
              Account
            </div>
            <div style={{ width: '30px', height: '1px', background: 'var(--color-border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: step === 2 ? '#0f172a' : 'var(--color-text-muted)', fontWeight: step === 2 ? 600 : 400 }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step === 2 ? '#0f172a' : 'transparent', border: step === 2 ? 'none' : '1px solid currentColor', color: step === 2 ? '#ffffff' : 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
              Verify
            </div>
          </div>

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#15803d', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={16} style={{ marginTop: '2px' }} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: '#334155' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', color: '#0f172a', transition: 'all 0.2s', outline: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: '#334155' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', color: '#0f172a', transition: 'all 0.2s', outline: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: '#334155' }}>
                  Password
                </label>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  showIcon
                  inputStyle={{
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                    background: '#f8fafc',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: '#334155' }}>
                  Confirm Password
                </label>
                <PasswordInput
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                  showIcon
                  inputStyle={{
                    padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#0f172a',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn primary"
                style={{ width: '100%', height: '44px' }}
              >
                {loading ? 'Continuing...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: '#334155' }}>
                  6-Digit Code
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    name="code"
                    required
                    maxLength={6}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                    placeholder="123456"
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '1.25rem', letterSpacing: '4px', textAlign: 'center', color: '#0f172a', transition: 'all 0.2s', outline: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn primary"
                style={{ width: '100%', height: '44px', marginBottom: '1rem' }}
              >
                {loading ? 'Verifying...' : 'Verify & Complete'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.875rem' }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                >
                  {resending ? <RefreshCw size={14} className="spin-icon" /> : null}
                  {resending ? 'Resending...' : 'Didn\'t receive a code? Resend'}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
      <ErrorModal isOpen={Boolean(error)} message={error} onClose={() => setError('')} />
    </div>
  );
}

export default RegisterPage;
