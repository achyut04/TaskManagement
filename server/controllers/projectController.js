const { Op } = require("sequelize");
const Project = require("../models/Project");
const User = require("../models/User");
const Task = require("../models/Task");
const {
  sendSuccess,
  sendNotFound,
  sendForbidden,
  sendError,
  sendInternalError,
} = require("../utils/responseHelper");

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      creator_id: req.user.id,
    });

    const projectWithDetails = await Project.findByPk(project.id, {
      include: [{ model: User, as: "creator", attributes: ["id", "username"] }],
    });
    return sendSuccess(
      res,
      projectWithDetails,
      "Project created successfully",
      null,
      201
    );
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};
const addProjectMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const projectId = req.params.id;

    const project = await Project.findByPk(projectId);
    const user = await User.findByPk(userId);

    if (!project) {
      return sendNotFound(res, "Project");
    }
    if (!user) {
      return sendNotFound(res, "User");
    }

    const isMember = await project.hasMember(user);
    if (isMember) {
      return sendError(
        res,
        "USER_ALREADY_MEMBER",
        "User is already a member of this project",
        null,
        400
      );
    }

    await project.addMember(user);
    return sendSuccess(
      res,
      null,
      "User added to project successfully",
      null,
      200
    );
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const getProjects = async (req, res) => {
  try {
    const search = req.query.search || "";

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    let projects;

    if (req.user.role === "Admin") {
      projects = await Project.findAll({
        where: whereClause,
        include: [
          { model: User, as: "creator", attributes: ["id", "username"] },
          {
            model: User,
            as: "members",
            attributes: ["id", "username"],
            through: { attributes: [] },
          },
        ],
        order: [["created_at", "DESC"]],
      });
    } else {
      projects = await Project.findAll({
        where: whereClause,
        include: [
          { model: User, as: "creator", attributes: ["id", "username"] },
          {
            model: User,
            as: "members",
            attributes: ["id", "username"],
            where: { id: req.user.id },
            through: { attributes: [] },
          },
        ],
        order: [["created_at", "DESC"]],
      });
    }
    return sendSuccess(res, projects, "Projects retrieved successfully");
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "username"] },
        {
          model: User,
          as: "members",
          attributes: ["id", "username", "email"],
          through: { attributes: [] },
        },
      ],
    });

    if (!project) {
      return sendNotFound(res, "Project");
    }

    const isMember = project.members.some(
      (member) => member.id === req.user.id
    );
    const isCreator = project.createdById === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isMember && !isCreator && !isAdmin) {
      return sendForbidden(res, "Access denied");
    }
    return sendSuccess(res, project, "Project retrieved successfully");
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return sendNotFound(res, "Project");
    }
    if (project.creator_id !== req.user.id && req.user.role !== "Admin") {
      // console.log(req.user.role);
      return sendForbidden(res, "Not authorized to update this project");
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description;

    await project.save();
    return sendSuccess(res, project, "Project updated successfully");
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return sendNotFound(res, "Project");
    }

    if (req.user.role !== "Admin" && project.creator_id !== req.user.id) {
      return sendForbidden(res, "Not authorized to delete this project");
    }

    await project.destroy();
    return sendSuccess(res, null, "Project removed", null, 204);
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findByPk(id);
    const userToRemove = await User.findByPk(userId);

    if (!project) {
      return sendNotFound(res, "Project");
    }
    if (!userToRemove) {
      return sendNotFound(res, "User");
    }

    if (req.user.role !== "Admin" && project.creator_id !== req.user.id) {
      return sendForbidden(res, "Not authorized to remove members");
    }

    await project.removeMember(userToRemove);
    return sendSuccess(res, null, "Member removed successfully", null, 200);
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    const project = await Project.findByPk(id);

    if (!project) {
      return sendNotFound(res, "Project");
    }

    const isMember = await project.hasMember(req.user);
    const isCreator = project.creator_id === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isMember && !isCreator && !isAdmin) {
      return sendForbidden(res, "Access denied");
    }

    const taskWhereClause = { project_id: id };
    if (search) {
      taskWhereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where: taskWhereClause,
      attributes: [
        "id",
        "title",
        "description",
        "status",
        "priority",
        "due_date",
        "assigned_to_id",
        "created_at",
      ],
      include: [
        { model: User, as: "assignee", attributes: ["id", "username"] },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    const meta = {
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count,
        perPage: limit,
      },
    };

    return sendSuccess(res, tasks, "Tasks retrieved successfully", meta);
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

module.exports = {
  createProject,
  getProjects,
  addProjectMember,
  getProjectById,
  updateProject,
  deleteProject,
  removeProjectMember,
  getProjectTasks,
};
