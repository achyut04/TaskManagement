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

const sendValidationError = (res, errors) => {
  return sendError(
    res,
    "VALIDATION_ERROR",
    "Validation failed",
    errors.length === 1 ? errors[0] : errors,
    400
  );
};

const sendNotFound = (res, resource = "Resource") => {
  return sendError(res, "NOT_FOUND", `${resource} not found`, null, 404);
};

const sendUnauthorized = (res, message = "Not authorized") => {
  return sendError(res, "UNAUTHORIZED", message, null, 401);
};

const sendForbidden = (res, message = "Access denied") => {
  return sendError(res, "FORBIDDEN", message, null, 403);
};

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
