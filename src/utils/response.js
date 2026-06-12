/**
 * Sends a successful JSON response.
 * @param {object} res Express response object
 * @param {string} message Action message
 * @param {any} data Response payload
 * @param {number} statusCode HTTP status code (default: 200)
 */
export const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends an error JSON response.
 * @param {object} res Express response object
 * @param {string} message Error message
 * @param {array} errors Detailed validation or sub-errors (default: [])
 * @param {number} statusCode HTTP status code (default: 500)
 */
export const sendError = (res, message, errors = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
