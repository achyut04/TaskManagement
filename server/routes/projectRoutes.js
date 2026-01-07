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

router.post("/", admin, createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/members", admin, addProjectMember);
router.delete("/:id/members/:userId", admin, removeProjectMember);

module.exports = router;
