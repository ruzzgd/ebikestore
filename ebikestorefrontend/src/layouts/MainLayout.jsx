import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import DashboardHeader from '../components/DashboardHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';

const APP_ROUTE_PREFIXES = ['/admin', '/staff', '/warehouse', '/inventory', '/transfers', '/account', '/profile', '/manage', '/applications', '/notifications', '/reports'];

export function MainLayout({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isHome = location.pathname === '/';
  const isAuth = ['/login', '/register', '/verify-email', '/forgot-password'].includes(location.pathname);
  const isApplicationPage = isAuthenticated && (
    APP_ROUTE_PREFIXES.some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`))
    || /^\/products\/[^/]+\/apply$/.test(location.pathname)
  );
  
  // Home gets 0 padding to let hero bleed under header
  // Auth gets exactly 4.5rem to clear the header with no extra breathing room
  // Other pages get 6.5rem top (4.5rem header + 2rem spacing) and 3rem bottom
  const paddingTop = isApplicationPage ? '0' : (isHome ? '0' : (isAuth ? '4.5rem' : '6.5rem'));
  const paddingBottom = isApplicationPage || isHome || isAuth ? '0' : '3rem';

  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isApplicationPage ? <DashboardHeader /> : <Header />}
      <main className={`main-content ${isApplicationPage ? 'dashboard-main' : ''}`} style={{ flex: 1, paddingTop, paddingBottom }}>
        <div className={isApplicationPage ? 'dashboard-page-container' : undefined}>
          {typeof children === 'function' ? children({}) : children}
        </div>
      </main>
      {!isApplicationPage && <Footer />}
    </div>
  );
}

export default MainLayout;
