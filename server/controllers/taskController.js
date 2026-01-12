const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { canTransition } = require("../utils/workflowRules");
const logActivity = require("../utils/logActivity");
const {
  sendSuccess,
  sendNotFound,
  sendForbidden,
  sendError,
  sendInternalError,
} = require("../utils/responseHelper");

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      project_id,
      assigned_to_id,
      due_date,
    } = req.body;
    const project = await Project.findByPk(project_id);
    if (!project) {
      return sendNotFound(res, "Project");
    }

    if (req.user.role !== "Admin") {
      return sendForbidden(res, "You must be an admin to create tasks");
    }

    const task = await Task.create({
      title,
      description,
      status: status || "Todo",
      priority: priority || "Medium",
      project_id,
      assigned_to_id: assigned_to_id || null,
      creator_id: req.user.id,
      due_date,
    });

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: "assignee", attributes: ["id", "username"] },
      ],
    });

    const io = req.app.get("io");
    if (io) {
      io.to(project_id).emit("task_created", fullTask);
    }

    return sendSuccess(
      res,
      fullTask,
      "Task created successfully",
      null,
      201
    );
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: "assignee", attributes: ["id", "username"] },
      ],
    });

    if (!task) {
      return sendNotFound(res, "Task");
    }

    if (updates.status && updates.status !== task.status) {
      const isValid = canTransition(task.status, updates.status);
      if (!isValid) {
        return sendError(
          res,
          "INVALID_WORKFLOW",
          `Invalid Workflow: Cannot move from '${task.status}' to '${updates.status}'.`,
          null,
          400
        );
      }
    }

    if (updates.status && updates.status !== task.status) {
      await logActivity(
        task.id,
        userId,
        "STATUS_CHANGE",
        `Changed status from ${task.status} to ${updates.status}`
      );
    }

    if (updates.priority && updates.priority !== task.priority) {
      await logActivity(
        task.id,
        userId,
        "PRIORITY_CHANGE",
        `Changed priority to ${updates.priority}`
      );
    }

    if (updates.due_date && updates.due_date !== task.due_date) {
      await logActivity(
        task.id,
        userId,
        "DUEDATE_CHANGE",
        `Changed due date to ${updates.due_date}`
      );
    }


    if (
      updates.assigned_to_id &&
      updates.assigned_to_id !== task.assigned_to_id
    ) {
      const user = await User.findByPk(updates.assigned_to_id);
      await logActivity(
        task.id,
        userId,
        "ASSIGNEE_CHANGE",
        `Changed assignee to ${user.username}`
      );
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.status = req.body.status || task.status;
    task.priority = req.body.priority || task.priority;
    task.assigned_to_id = req.body.assigned_to_id;
    task.due_date = req.body.due_date;

    await task.save();
    await task.reload();

    const io = req.app.get("io");
    if (io) {
      io.to(task.project_id).emit("task_updated", task);
    }

    return sendSuccess(res, task, "Task updated successfully");
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);

    if (!task) {
      return sendNotFound(res, "Task");
    }

    if (req.user.role !== "Admin" && task.createdById !== req.user.id) {
      return sendForbidden(res, "Not authorized to delete this task");
    }

    const projectId = task.projectId;
    await task.destroy();

    const io = req.app.get("io");
    if (io) {
      io.to(projectId).emit("task_deleted", id);
    }

    return sendSuccess(res, null, "Task deleted", null, 204);
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const getTaskLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await ActivityLog.findAll({
      where: { task_id: id },
      include: [{ model: User, as: "actor", attributes: ["id", "username"] }],
      order: [["created_at", "DESC"]],
    });
    return sendSuccess(res, logs, "Task logs retrieved successfully");
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

module.exports = { createTask, updateTask, deleteTask, getTaskLogs };
