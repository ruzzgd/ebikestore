import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MailCheck, KeyRound, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import authService from '../../services/authService.js';

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Determine target verification email from location state or sessionStorage
    const pendingEmail = location.state?.email || sessionStorage.getItem('pending_verify_email') || '';
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [location.state]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !code) {
      setError('Please provide both email address and verification code');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.verifyEmail({ email: email.trim(), code: code.trim() });
      sessionStorage.removeItem('pending_verify_email');
      
      // Navigate to login with success state
      navigate('/login', {
        state: { verifiedMessage: result.message || 'Email verified successfully. You can now sign in.' },
      });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address to resend verification code');
      return;
    }

    setResending(true);

    try {
      const result = await authService.resendVerification({ email: email.trim() });
      setMessage(result.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <MailCheck size={38} color="#0d9488" style={{ marginBottom: '0.5rem' }} />
          <h2>Verify Your Email</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Enter the 6-digit code sent to your email address
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-status-error)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-status-success)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', color: '#6ee7b7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleVerify} id="form-verify-email">
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={{ width: '100%', padding: '0.65rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
              id="input-verify-email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
              6-Digit Verification Code
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2.4rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '1.1rem', letterSpacing: '4px', textAlign: 'center' }}
                id="input-verify-code"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-refresh"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', background: 'var(--color-brand-primary)', borderColor: 'var(--color-brand-primary)', fontWeight: '600', marginBottom: '1rem' }}
            id="btn-verify-submit"
          >
            <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ color: 'var(--color-brand-light)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '500' }}
            id="btn-resend-code"
          >
            {resending ? <RefreshCw size={14} className="spin-icon" /> : null}
            <span>{resending ? 'Resending code...' : "Didn't receive a code? Resend"}</span>
          </button>

          <Link to="/login" style={{ color: 'var(--color-text-muted)' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
