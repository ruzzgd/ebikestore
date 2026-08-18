import { useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export default function useInactivityLogout() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const timeoutMinutes = parseInt(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES || '30', 10);
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(async () => {
        // Log out user due to inactivity
        await logout();
        navigate('/login?expired=true');
      }, timeoutMs);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Initial setup
    resetTimer();

    // Attach event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, timeoutMs]);
}
