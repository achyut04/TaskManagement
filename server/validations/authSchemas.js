const { z } = require("zod");

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username should be atleast 3 characters long")
    .max(30, "Username shouldn't exceed 30 characters.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.email("Invalid email address."),
  password: z.string().min(6, "Password should be atleast 6 characters long"),
});

const loginSchema = z.object({
  email: z.email("Invalid email address."),
  password: z.string().min(6, "Password should be atleast 6 characters long"),
});

module.exports = { registerSchema, loginSchema };
