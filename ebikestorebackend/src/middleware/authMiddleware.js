import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import config from '../config/index.js';

const getRequestToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];
  return req.cookies?.[config.jwt.cookieName] || null;
};

const attachVerifiedUser = (req, token) => {
  const decoded = verifyToken(token);
  if (decoded.isActive === false) {
    throw new UnauthorizedError('Your account has been deactivated');
  }
  req.user = decoded;
};

/**
 * Authentication Middleware
 * Extracts JWT token from Authorization header or HTTP-Only cookie, verifies token,
 * and attaches authenticated user object to req.user.
 */
export const authenticate = (req, res, next) => {
  const token = getRequestToken(req);

  if (!token) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  try {
    attachVerifiedUser(req, token);
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

/**
 * Adds authentication context when a token is present while keeping genuinely
 * public requests accessible. Invalid or expired tokens simply provide no
 * authenticated context, so public catalog browsing continues to work.
 */
export const optionalAuthenticate = (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) return next();

  try {
    attachVerifiedUser(req, token);
    return next();
  } catch (error) {
    req.user = undefined;
    return next();
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
