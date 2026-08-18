import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import config from '../config/index.js';

/**
 * Authentication Middleware
 * Extracts JWT token from Authorization header or HTTP-Only cookie, verifies token,
 * and attaches authenticated user object to req.user.
 */
export const authenticate = (req, res, next) => {
  let token = null;

  // 1. Check Authorization Header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // 2. Check HTTP-Only Cookie fallback
  else if (req.cookies && req.cookies[config.jwt.cookieName]) {
    token = req.cookies[config.jwt.cookieName];
  }

  if (!token) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  try {
    const decoded = verifyToken(token);

    // Reject inactive user accounts
    if (decoded.isActive === false) {
      return next(new UnauthorizedError('Your account has been deactivated'));
    }

    req.user = decoded;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

/**
 * Role Authorization Middleware
 * @param {...string} allowedRoles - Permitted backend roles ('admin', 'branch_staff', 'warehouse_staff', 'customer')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication context missing'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
};
