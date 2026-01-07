const { z } = require("zod");

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

      return res.status(400).json({
        message: "Validation Error",
        errors: errorMessages,
      });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = validate;
