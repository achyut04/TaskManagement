const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjects,
  addProjectMember,
  getProjectById,
  updateProject,
  deleteProject,
  removeProjectMember,
} = require("../controllers/projectController");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectParamsSchema,
  removeMemberParamsSchema,
} = require("../validations/projectSchemas");
const validate = require("../middleware/validate");

router.post("/", admin, validate(createProjectSchema), createProject);
router.get("/", getProjects);
router.get("/:id", validate(projectParamsSchema, "params"), getProjectById);
router.put(
  "/:id",
  admin,
  validate(projectParamsSchema, "params"),
  validate(updateProjectSchema),
  updateProject
);
router.delete(
  "/:id",
  admin,
  validate(projectParamsSchema, "params"),
  deleteProject
);
router.post(
  "/:id/members",
  admin,
  validate(projectParamsSchema, "params"),
  validate(addMemberSchema),
  addProjectMember
);
router.delete(
  "/:id/members/:userId",
  admin,
  validate(removeMemberParamsSchema, "params"),
  removeProjectMember
);

module.exports = router;
