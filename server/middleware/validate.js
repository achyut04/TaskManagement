const { z } = require("zod");
const { sendValidationError, sendInternalError } = require("../utils/responseHelper");

const validate = (schema) => (req, res, next) => {
  try {
    const data = { ...req.params, ...req.body };
    schema.parse(data);

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => {
        return `${err.path.join(".")}: ${err.message}`;
      });

      return sendValidationError(res, errorMessages);
    }

    return sendInternalError(res, "Internal Server Error");
  }
};

module.exports = validate;
