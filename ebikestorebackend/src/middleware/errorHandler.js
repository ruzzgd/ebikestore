import config from '../config/index.js';

/**
 * Centralized Application Error Handling Middleware
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let status = err.status || (statusCode >= 500 ? 'error' : 'fail');
  let details = err.details || null;

  // Handle specific MySQL or JWT errors cleanly
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    status = 'fail';
    message = 'This record already exists.';
  } else if (err.code && err.code.startsWith('ER_')) {
    // Mask generic MySQL errors
    statusCode = 500;
    status = 'error';
    message = 'Internal Server Error';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Authentication token expired';
  } else if (!err.isOperational && statusCode === 500) {
    // Mask generic unhandled error messages
    message = 'Internal Server Error';
  }

  const errorResponse = {
    status,
    message,
    ...(details && { details }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  // Log server errors (500)
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
