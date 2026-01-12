const { z } = require("zod");

const addCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters"),
});

module.exports = {
  addCommentSchema,
};
