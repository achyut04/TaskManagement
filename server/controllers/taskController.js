const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

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
    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: "assignee", attributes: ["id", "username"] },
      ],
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.status = req.body.status || task.status;
    task.priority = req.body.priority || task.priority;
    task.assigned_to_id = req.body.assigned_to_id || task.assigned_to_id;
    task.due_date = req.body.due_date || task.due_date;

    await task.save();

    await task.reload();

    const io = req.app.get("io");
    if (io) {
      io.to(task.projectId).emit("task_updated", task);
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

module.exports = { createTask, updateTask, deleteTask };
