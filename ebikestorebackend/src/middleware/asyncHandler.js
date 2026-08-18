/**
 * Async handler wrapper to eliminate try/catch blocks in express routes/controllers
 * @param {Function} fn
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
