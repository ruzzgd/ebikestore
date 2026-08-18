import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle, ArrowRight, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import authService from '../../services/authService.js';

const ROLE_REDIRECT_MAP = {
  admin: '/admin',
  branch_staff: '/staff',
  warehouse_staff: '/warehouse',
  customer: '/account',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isExpired = searchParams.get('expired') === 'true';
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.verifiedMessage || '');

  useEffect(() => {
    // Check if we came from register with a pending verify
    const pendingEmail = location.state?.email || sessionStorage.getItem('pending_verify_email');
    if (pendingEmail) {
      setFormData(prev => ({ ...prev, email: pendingEmail }));
      if (location.pathname === '/verify-email') {
         setStep(2);
      }
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      
      const targetPath = location.state?.from?.pathname || ROLE_REDIRECT_MAP[user.role] || '/account';
      navigate(targetPath, { replace: true });
    } catch (err) {
      if (err.data?.details?.code === 'EMAIL_NOT_VERIFIED' || err.message?.includes('verify your email')) {
        setStep(2);
        setSuccess('Please verify your email address to continue.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
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
      sessionStorage.removeItem('pending_verify_email');
      
      // Auto-login since we still have the password in state
      if (formData.password) {
        const user = await login(formData.email, formData.password);
        const targetPath = location.state?.from?.pathname || ROLE_REDIRECT_MAP[user.role] || '/account';
        navigate(targetPath, { replace: true });
      } else {
        setStep(1);
        setSuccess('Email verified successfully. You can now sign in.');
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
          <h2 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Welcome Back.</h2>
          <p style={{ fontSize: '1.15rem', color: '#e2e8f0', lineHeight: 1.6, maxWidth: '85%' }}>Sign in to manage your customer applications, check inventory, and view account details.</p>
        </div>
      </div>
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '16px', padding: '3rem 2.5rem', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
              {step === 1 ? 'Sign in' : 'Verify Email'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {step === 1 ? 'Welcome back to Fidelo E-Bike Store' : `We sent a code to ${formData.email}`}
            </p>
          </div>

          {step === 2 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>1</span>
                Account
              </div>
              <div style={{ width: '30px', height: '1px', background: 'var(--color-border)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0f172a', fontWeight: 600 }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f172a', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span>
                Verify
              </div>
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#15803d', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={16} style={{ marginTop: '2px' }} />
              <span>{success}</span>
            </div>
          )}

          {isExpired && step === 1 && (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#a16207', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ marginTop: '2px' }} />
              <span>Your session has expired due to inactivity. Please log in again.</span>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleLoginSubmit}>
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

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>
                    Password
                  </label>
                  <Link to="/forgot-password" className="auth-inline-link">Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', color: '#0f172a', transition: 'all 0.2s', outline: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand-primary)'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn primary"
                style={{ width: '100%', height: '44px' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
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
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                >
                  {resending ? <RefreshCw size={14} className="spin-icon" /> : null}
                  {resending ? 'Resending...' : 'Resend code'}
                </button>
                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0 }}>
                  Back
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
