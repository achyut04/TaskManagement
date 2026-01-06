const { Project, User, Task } = require("../models");

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      createdById: req.user.id,
    });

    await project.addMember(req.user.id);

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const addProjectMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const projectId = req.params.id;

    const project = await Project.findByPk(projectId);
    const user = await User.findByPk(userId);

    if (!project || !user) {
      return res.status(404).json({ message: "Project or User not found" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admins can add members" });
    }

    const isMember = await project.hasMember(user);
    if (isMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of this project" });
    }

    await project.addMember(user);
    res.status(200).json({ message: "User added to project successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === "Admin") {
      projects = await Project.findAll({
        include: [
          { model: User, as: "creator", attributes: ["id", "username"] },
          {
            model: User,
            as: "members",
            attributes: ["id", "username"],
            through: { attributes: [] },
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    } else {
      projects = await Project.findAll({
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
        order: [["createdAt", "DESC"]],
      });
    }

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
        {
          model: Task,
          attributes: ["id", "title", "status", "priority", "assignedToId"],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(
      (member) => member.id === req.user.id
    );
    if (req.user.role !== "Admin" && !isMember) {
      return res.status(403).json({
        message: "Access denied. You are not a member of this project.",
      });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (req.user.role !== "Admin" && project.createdById !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this project" });
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (req.user.role !== "Admin" && project.createdById !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this project" });
    }

    await project.destroy();
    res.json({ message: "Project removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findByPk(id);
    const userToRemove = await User.findByPk(userId);

    if (!project || !userToRemove) {
      return res.status(404).json({ message: "Project or User not found" });
    }

    if (req.user.role !== "Admin" && project.createdById !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to remove members" });
    }

    await project.removeMember(userToRemove);
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
};
