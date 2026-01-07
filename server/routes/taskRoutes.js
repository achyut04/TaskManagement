const express = require("express");
const router = express.Router();
const {
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
} = require("../validations/taskSchemas");
const validate = require("../middleware/validate");

router.post("/", validate(createTaskSchema), createTask);
router.put("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", validate(taskParamsSchema, "params"), deleteTask);

module.exports = router;
