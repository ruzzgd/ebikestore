import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <ShieldCheck size={48} color="var(--color-brand-primary)" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Terms of Service</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Last updated: August 2026</p>
      </div>
      
      <div className="card" style={{ padding: '3rem' }}>
        <div style={{ display: 'grid', gap: '2rem', color: '#334155', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>1. Introduction</h2>
            <p>
              Welcome to the Fidelo E-Bike Store. These Terms of Service govern your use of our website and services. By accessing or using our website, you agree to be bound by these terms.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>2. Use of the Website</h2>
            <p>
              You may use our website only for lawful purposes. You agree not to use our website in any way that violates any applicable national or international law or regulation, or to engage in any conduct that restricts or inhibits anyone's use or enjoyment of the website.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>3. Customer Accounts</h2>
            <p>
              To access certain features, you must create a customer account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>4. Product Information and Availability</h2>
            <p>
              We strive to ensure that product descriptions, pricing, and availability are accurate. However, we do not warrant that product descriptions or other content are error-free. Availability is subject to change without notice and is not guaranteed until a transaction is completed in-store.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>5. Customer Applications and Store Transactions</h2>
            <p>
              Submitting a customer application through our website initiates the purchase process. It does not constitute a binding contract of sale, nor does it guarantee inventory reservation or approval. Final transactions, identity verification, and payment processing are completed exclusively at a physical Fidelo branch location.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>6. Prohibited Use</h2>
            <p>
              You are prohibited from bypassing or attempting to bypass our security measures, using automated systems to scrape data, or transmitting malicious code through our platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use of the website following the posting of revised terms means that you accept and agree to the changes.
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

export default TermsPage;
