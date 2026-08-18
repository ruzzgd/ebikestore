import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <Lock size={48} color="var(--color-brand-primary)" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Last updated: August 2026</p>
      </div>
      
      <div className="card" style={{ padding: '3rem' }}>
        <div style={{ display: 'grid', gap: '2rem', color: '#334155', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>1. Information Collected</h2>
            <p>
              We collect information that you provide directly to us when you create an account, submit a customer application, or communicate with us. This includes your name, email address, contact information, and identity verification details required for processing e-bike applications.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>2. Identity Information</h2>
            <p>
              When you submit a customer application, we collect necessary identity details (such as ID numbers and birth dates). Sensitive customer information is protected using encryption and strict role-based access controls within our database.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>3. How Information Is Used</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services; to process your applications; to send you technical notices and support messages; and to communicate with you about your transaction status at our physical branches.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>4. Data Security</h2>
            <p>
              We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. Sensitive PII (Personally Identifiable Information) submitted during the application process is encrypted at rest.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>5. Cookies and Authentication</h2>
            <p>
              We use HTTP-only cookies to securely manage your authentication sessions. These cookies are essential for the operation of the customer portal and cannot be disabled if you wish to log in and use our authenticated services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>6. Who Can Access Information</h2>
            <p>
              Your information is accessible only to authorized personnel, including branch staff and administrators, strictly for the purpose of fulfilling your application and transaction. We do not sell or share your personal information with third-party marketers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, comply with our legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/" style={{ color: 'var(--color-brand-primary)', fontWeight: 500, textDecoration: 'none' }}>&larr; Return to Home</Link>
      </div>
    </div>
  );
}

export default PrivacyPage;
