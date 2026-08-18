import config from '../config/index.js';
import { doubleCsrf } from 'csrf-csrf';

const {
  generateToken, // The original code didn't work because it's called generateToken in the docs but doubleCsrf returned generateCsrfToken? Wait, let me just alias generateCsrfToken.
  // Actually, I'll alias it:
  generateCsrfToken: doubleCsrfGenerateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.jwt.secret || 'default_fallback_secret_ebikestore',
  cookieName: 'csrf_token', // keeping the same cookie name so frontend still works or we can change it, but it's httpOnly.
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: config.env === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
  getSessionIdentifier: (req) => 'ebike-csrf',
});

export const generateCsrfToken = (req, res) => {
  const token = doubleCsrfGenerateToken(req, res, true); // true to overwrite existing if needed
  res.status(200).json({ status: 'success', data: { csrfToken: token } });
};

export const csrfProtection = (req, res, next) => {
  const exemptRoutes = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/verify-email',
    '/api/v1/auth/resend-verification'
  ];
  
  if (exemptRoutes.some(route => req.originalUrl.startsWith(route))) {
    return next();
  }

  doubleCsrfProtection(req, res, (err) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ status: 'error', message: 'Invalid or missing CSRF token' });
    }
    if (err) {
      return next(err);
    }
    next();
  });
};
