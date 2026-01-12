const express = require("express");
const router = express.Router();
const {
  createTask,
  updateTask,
  deleteTask,
  getTaskLogs,
} = require("../controllers/taskController");
const {
  getTaskComments,
  addComment,
} = require("../controllers/commentController");
const {
  uploadFile,
  getTaskFiles,
  deleteFile,
  downloadFile,
} = require("../controllers/fileAttachmentController");
const {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
} = require("../validations/taskSchemas");
const { addCommentSchema } = require("../validations/commentSchema");
const validate = require("../middleware/validate");

router.post("/", validate(createTaskSchema), createTask);
router.put(
  "/:id",
  validate(taskParamsSchema),
  validate(updateTaskSchema),
  updateTask
);
router.delete("/:id", validate(taskParamsSchema), deleteTask);
router.get("/:id/comments", validate(taskParamsSchema), getTaskComments);
router.post(
  "/:id/comments",
  validate(taskParamsSchema),
  validate(addCommentSchema),
  addComment
);
router.get("/:id/activity", validate(taskParamsSchema), getTaskLogs);
router.post("/:id/files", validate(taskParamsSchema), uploadFile);
router.get("/:id/files", validate(taskParamsSchema), getTaskFiles);
router.delete("/:id/files/:fileId", validate(taskParamsSchema), deleteFile);
router.get("/:id/files/:fileId/download", validate(taskParamsSchema), downloadFile);

module.exports = router;
