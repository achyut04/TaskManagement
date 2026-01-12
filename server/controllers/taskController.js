const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { canTransition } = require("../utils/workflowRules");
const logActivity = require("../utils/logActivity");
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
    console.log(req.body);
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "You must be an admin to create tasks" });
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
      io.to(projectId).emit("task_created", fullTask);
    }

    res.status(201).json(fullTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (updates.status && updates.status !== task.status) {
      const isValid = canTransition(task.status, updates.status);
      if (!isValid) {
        return res.status(400).json({
          message: `Invalid Workflow: Cannot move from '${task.status}' to '${updates.Projectstatus}'.`,
        });
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

    if (
      updates.assigned_to_id !== undefined &&
      updates.assigned_to_id !== task.assigned_to_id
    ) {
      const actionDetails = updates.assigned_to_id
        ? "Updated assignee"
        : "Unassigned the task";

      await logActivity(task.id, userId, "ASSIGNMENT", actionDetails);
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

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== "Admin" && task.createdById !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    const projectId = task.projectId;
    await task.destroy();

    const io = req.app.get("io");
    if (io) {
      io.to(projectId).emit("task_deleted", id);
    }

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, updateTask, deleteTask, getTaskLogs };
