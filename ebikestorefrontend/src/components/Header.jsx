import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogIn, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const ROLE_DASHBOARD_MAP = {
  admin: '/admin',
  branch_staff: '/staff',
  warehouse_staff: '/warehouse',
  customer: '/account',
};

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    if (isHome) {
      window.addEventListener('scroll', handleScroll);
      handleScroll();
    } else {
      setScrolled(true);
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const dashboardPath = user?.role ? ROLE_DASHBOARD_MAP[user.role] : '/account';

  // Determine styles based on scroll state and route
  const headerClass = `app-header ${!scrolled && isHome ? 'transparent' : 'solid'}`;
  const mutedTextColor = !scrolled && isHome ? '#ffffff' : '#475569';

  return (
    <header className={headerClass}>
      <div className="container">
        <nav className="header-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4.5rem' }}>
          <div className="public-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <Link to="/" className="brand-logo fidelo-public-logo" id="header-brand-logo" aria-label="Fidelo E-Bike home">
              <img src="/images/fidelo-header-logo.png" alt="Fidelo E-Bike" />
            </Link>

            <div className="public-nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <Link to="/products" style={{ fontSize: '0.875rem', color: mutedTextColor, display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '500', textDecoration: 'none', transition: 'color 0.3s ease' }} id="link-nav-catalog">
                <ShoppingBag size={16} />
                <span>Shop E-Bikes</span>
              </Link>
              <Link to="/contact" style={{ fontSize: '0.875rem', color: mutedTextColor, display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '500', textDecoration: 'none', transition: 'color 0.3s ease' }} id="link-nav-contact">
                <span>Contact Us</span>
              </Link>
            </div>
          </div>

          <div className="public-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <Link
                  to={dashboardPath}
                  className="public-dashboard-link"
                  style={{ color: !scrolled && isHome ? '#0f172a' : '#ffffff', background: !scrolled && isHome ? '#ffffff' : '#0f172a' }}
                  id="link-nav-dashboard"
                >
                  <LayoutDashboard size={16} />
                  <span>Open Dashboard</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <Link to="/login" id="link-nav-login" style={{ background: 'transparent', border: 'none', color: mutedTextColor, fontWeight: '500', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'color 0.3s ease' }}>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </Link>

                <Link
                  to="/register"
                  style={{ 
                    background: !scrolled && isHome ? '#ffffff' : '#0f172a', 
                    border: 'none', 
                    color: !scrolled && isHome ? '#0f172a' : '#ffffff', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '4px', 
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  id="link-nav-register"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
