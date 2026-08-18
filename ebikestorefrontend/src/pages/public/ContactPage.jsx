import React from 'react';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#0f172a' }}>Contact Fidelo</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>
          Have questions about our e-bikes or need assistance with your application? We are here to help.
        </p>
      </div>

      <div className="grid-cols-3" style={{ gap: '2rem', marginBottom: '4rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Mail size={24} color="var(--color-brand-primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>Email Us</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>For general inquiries and support.</p>
          <a href="mailto:support@fidelobikes.com" style={{ color: 'var(--color-brand-teal)', fontWeight: 500, marginTop: 'auto' }}>support@fidelobikes.com</a>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Phone size={24} color="var(--color-brand-primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>Call Support</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>Available Monday to Friday, 9am - 6pm.</p>
          <span style={{ color: '#0f172a', fontWeight: 500, marginTop: 'auto' }}>+63 (2) 8123 4567</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <MapPin size={24} color="var(--color-brand-primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>Visit a Branch</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>Find a Fidelo branch near you.</p>
          <span style={{ color: 'var(--color-text-secondary)', marginTop: 'auto', fontSize: '0.85rem' }}>Check our Locations network</span>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', background: '#f8fafc', padding: '3rem', textAlign: 'center' }}>
        <MessageSquare size={32} color="#94a3b8" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0f172a' }}>Need immediate help with your application?</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
          If you have already submitted an application, you can coordinate with branch staff directly through your account dashboard.
        </p>
      </div>
    </div>
  );
}

export default ContactPage;
