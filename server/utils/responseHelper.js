/**
 * Standardized API Response Helper
 * Ensures all API responses follow a consistent format
 */

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {Object} meta - Optional metadata (e.g., pagination)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (
  res,
  data,
  message = null,
  meta = null,
  statusCode = 200
) => {
  if (statusCode === 204) {
    return res.status(204).send();
  }

  const response = {
    success: true,
    statusCode: statusCode,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {string} code - Error code (e.g., "INVALID_EMAIL")
 * @param {string} message - Error message
 * @param {string} details - Optional detailed error information
 * @param {number} statusCode - HTTP status code (default: 400)
 */
const sendError = (res, code, message, details = null, statusCode = 400) => {
  const response = {
    success: false,
    statusCode: statusCode,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation Error Response
 * @param {Object} res - Express response object
 * @param {Array<string>} errors - Array of validation error messages
 */
const sendValidationError = (res, errors) => {
  return sendError(
    res,
    "VALIDATION_ERROR",
    "Validation failed",
    errors.length === 1 ? errors[0] : errors,
    400
  );
};

/**
 * Not Found Error Response
 * @param {Object} res - Express response object
 * @param {string} resource - Name of the resource that was not found
 */
const sendNotFound = (res, resource = "Resource") => {
  return sendError(res, "NOT_FOUND", `${resource} not found`, null, 404);
};

/**
 * Unauthorized Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Optional custom message
 */
const sendUnauthorized = (res, message = "Not authorized") => {
  return sendError(res, "UNAUTHORIZED", message, null, 401);
};

/**
 * Forbidden Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Optional custom message
 */
const sendForbidden = (res, message = "Access denied") => {
  return sendError(res, "FORBIDDEN", message, null, 403);
};

/**
 * Internal Server Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Optional custom message
 */
const sendInternalError = (res, message = "Internal server error") => {
  return sendError(res, "INTERNAL_ERROR", message, null, 500);
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendInternalError,
};
