import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Sign JWT Token
 * @param {object} payload - Data payload (e.g. { userId, role })
 * @param {object} [options] - Additional JWT options
 * @returns {string} Signed JWT token
 */
export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    ...options,
  });
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token string
 * @returns {object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};
