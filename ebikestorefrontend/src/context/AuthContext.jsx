import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser || null);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginUser = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    try { localStorage.setItem('auth_login_event', String(Date.now())); } catch (e) {}
    return data.user;
  };

  const logoutUser = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(null);
      try { localStorage.setItem('auth_logout_event', String(Date.now())); } catch (e) {}
    }
  };

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'auth_logout_event') {
        setUser(null);
      } else if (e.key === 'auth_login_event') {
        checkAuth();
      }
    };

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [checkAuth]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login: loginUser,
    logout: logoutUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
