const { z } = require("zod");

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.uuid("Invalid User ID format"),
});

const projectParamsSchema = z.object({
  id: z.uuid("Invalid Project ID format"),
});

const removeMemberParamsSchema = z.object({
  id: z.uuid("Invalid Project ID"),
  userId: z.uuid("Invalid User ID"),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectParamsSchema,
  removeMemberParamsSchema,
};
