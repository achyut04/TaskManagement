const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional(),
  status: z.enum(["Todo", "In Progress", "Done"]).default("Todo"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),

  project_id: z.uuid("Invalid Project ID format"),
  assigned_to_id: z.uuid("Invalid User ID format").nullable().optional(),

  due_date: z.iso
    .datetime({ message: "Invalid Date format" })
    .nullable()
    .optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(["Todo", "In Progress", "Done"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),

  assigned_to_id: z.uuid().nullable().optional(),
  due_date: z.iso.datetime().nullable().optional(),
});

const taskParamsSchema = z.object({
  id: z.uuid("Invalid Task ID format"),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
};
