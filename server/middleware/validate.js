const { z } = require("zod");

const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    try {
      schema.parse(req[source]);

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
