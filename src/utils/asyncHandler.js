/**
 * Wrapper for Express route handlers to capture errors and forward them to the next middleware.
 * @param {Function} fn Async route handler function
 * @returns {Function} Express route middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
