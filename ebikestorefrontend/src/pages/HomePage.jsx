import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/productService.js';
import { getLocations } from '../services/locationService.js';
import { BatteryCharging, CheckCircle2, Headphones, MapPin, ShieldCheck } from 'lucide-react';

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (imageKey) => {
    if (!imageKey) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/uploads/images/${imageKey}`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, locationsData] = await Promise.all([
          getProducts({ activeOnly: true }),
          getLocations()
        ]);
        setProducts((productsData || []).slice(0, 4));
        setLocations(locationsData || []);
      } catch (error) {
        console.error('Failed to load homepage data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="home-page" style={{ width: '100%', background: '#ffffff' }}>
      {/* 1. Full-cover Hero */}
      <section className="home-hero" style={{
        position: 'relative',
        height: '100svh',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#000000'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
          zIndex: 1
        }} />
        <img 
          src="/images/fidelo-ebike-hero.jpg"
          alt="Fidelo electric passenger cart"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.9,
            zIndex: 0
          }}
          loading="eager"
        />
        
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '640px' }}>
            <h1 style={{ 
              fontSize: 'clamp(3rem, 6vw, 4.5rem)', 
              fontWeight: 700, 
              color: '#ffffff', 
              marginBottom: '1.5rem', 
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}>
              Electric mobility, <br/>refined.
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#f1f5f9', 
              marginBottom: '2.5rem', 
              lineHeight: 1.5,
              maxWidth: '500px',
              fontWeight: 400
            }}>
              Browse Fidelo electric passenger and utility carts across our branches. Submit your application online and complete your transaction in-store.
            </p>
            <div className="hero-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/products" className="btn primary" style={{ padding: '0 1.5rem', height: '48px', fontSize: '1rem' }}>
                Browse Electric Carts
              </Link>
              <Link to="/register" className="btn secondary" style={{ padding: '0 1.5rem', height: '48px', fontSize: '1rem' }}>
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compact Value Strip */}
      <section className="home-value-strip" style={{ borderBottom: '1px solid var(--color-border)', background: '#ffffff' }}>
        <div className="container" style={{ padding: '2rem 1rem' }}>
          <div className="value-strip-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Check Availability</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Across Fidelo locations</p>
            </div>
            <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '2rem' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Digital Application</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Start your application online</p>
            </div>
            <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '2rem' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Multi-Location Inventory</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Bulan • Burabod • Naga</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="home-featured" style={{ padding: '6rem 0', background: '#f8fafc' }}>
        <div className="container">
          <div className="home-section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Featured Models</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>Explore our latest electric passenger and utility carts</p>
            </div>
            <Link to="/products" className="btn ghost">
              View All Products
            </Link>
          </div>
          
          {loading ? (
             <div style={{ padding: '2rem 0', color: '#64748b' }}>Loading inventory...</div>
          ) : (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {products.map(product => (
                <Link to={`/products/${product.id}`} key={product.id} className="card home-product-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', textDecoration: 'none' }}>
                  <div style={{ height: '220px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)' }}>
                    {product.image_key ? (
                      <img src={getImageUrl(product.image_key)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>No Image</span>
                    )}
                  </div>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      {product.category_name}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#0f172a' }}>{product.name}</h3>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        ₱{Number(product.unit_price).toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--color-brand-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                        View Details &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Editorial E-Bike Section */}
      <section className="home-editorial" style={{ padding: '6rem 0', background: '#ffffff', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="editorial-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div style={{ width: '100%', height: '500px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                <img 
                  src="/images/fidelo-ebike-hero.jpg" 
                  alt="Fidelo electric passenger cart" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Built for practical electric mobility.
              </h2>
              <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2rem', lineHeight: 1.7 }}>
                Our covered electric carts combine passenger comfort, everyday utility, and dependable local mobility. With our connected inventory system, you can easily find the model you need across our branch network.
              </p>
              <ul style={{ display: 'grid', gap: '1rem', marginBottom: '2rem', listStyle: 'none', padding: 0 }}>
                {['Premium build quality', 'Long-lasting battery systems', 'Connected branch inventory', 'In-store servicing and support'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155' }}>
                    <CheckCircle2 size={20} color="var(--color-brand-primary)" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/products" className="btn primary" style={{ height: '48px', padding: '0 2rem' }}>
                Explore the Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="home-process" style={{ padding: '6rem 0', background: '#0f172a', color: '#ffffff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              The Purchase Process
            </h2>
              <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>A streamlined approach to getting your new electric cart.</p>
          </div>
          
          <div className="process-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
            {[
              { num: '01', title: 'Browse', desc: 'Explore available electric carts in our catalog.' },
              { num: '02', title: 'Check Availability', desc: 'See availability across Fidelo branches.' },
              { num: '03', title: 'Apply', desc: 'Submit your customer application online.' },
              { num: '04', title: 'Visit Branch', desc: 'Coordinate with store staff to complete the transaction.' }
            ].map((step, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', lineHeight: 1 }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#ffffff' }}>{step.title}</h3>
                <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem' }}>{step.desc}</p>
                {i < 3 && (
                  <div style={{ position: 'absolute', top: '1.75rem', right: '-1rem', width: '2rem', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Locations */}
      <section className="home-locations" style={{ padding: '6rem 0', background: '#f8fafc' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '3rem', letterSpacing: '-0.02em', textAlign: 'center' }}>
            Our Network
          </h2>
          
          {loading ? (
            <div style={{ color: '#64748b', textAlign: 'center' }}>Loading locations...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {locations.map((loc, i) => (
                <div key={i} className="card home-location-card" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={24} color="var(--color-brand-primary)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>{loc.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {loc.type === 'branch' ? 'Customer Branch' : 'Stock & Support Warehouse'}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.5, marginTop: 'auto' }}>{loc.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ownership information */}
      <section className="info-section">
        <div className="container">
          <div style={{ maxWidth: '680px', marginBottom: '3rem' }}>
            <span className="eyebrow" style={{ color: '#0f766e' }}>ELECTRIC MOBILITY FOR EVERYDAY NEEDS</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: '.65rem 0 1rem' }}>Support for every part of your ride.</h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.75 }}>Choosing an electric cart is about capacity, range, service, and intended use—not only appearance. Our team helps you compare models, locate available stock, and understand what happens after you apply.</p>
          </div>
          <div className="info-grid">
            <article className="info-card"><BatteryCharging size={30} /><h3>Choose the right range</h3><p>Compare the models in our catalog and speak with branch staff about your daily route, charging access, and riding needs.</p></article>
            <article className="info-card"><ShieldCheck size={30} /><h3>Clear application process</h3><p>Your online application reserves your interest for staff review. Final availability, requirements, and payment are confirmed in-store.</p></article>
            <article className="info-card"><Headphones size={30} /><h3>Local after-sales support</h3><p>Visit the Fidelo location nearest you for product guidance, pickup coordination, and help caring for your electric cart.</p></article>
          </div>
          <div style={{ marginTop: '2.5rem', padding: '1.5rem', borderRadius: '14px', background: '#f0fdfa', border: '1px solid #99f6e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div><h3 style={{ marginBottom: '.25rem' }}>Still deciding which model fits?</h3><p style={{ color: '#475569' }}>Tell our team about your commute and preferred branch.</p></div>
            <Link to="/contact" className="btn primary">Talk to Fidelo</Link>
          </div>
        </div>
      </section>

      {/* 7. Application CTA */}
      <section className="home-cta" style={{ padding: '6rem 0', background: '#ffffff', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Ready to ride?
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Browse our products, submit your customer application securely, and complete your transaction with our branch staff.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/products" className="btn primary" style={{ height: '48px', padding: '0 2rem' }}>
              Shop Electric Carts
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
