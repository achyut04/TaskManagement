const Project = require("../models/Project");
const User = require("../models/User");

const createProject = async (req, res) => {
  const { name, description } = req.body;

  if (!name)
    return res.status(401).json({ message: "Project name is required." });

  const project = await Project.create({
    name,
    description,
    createdById: req.user.id,
  });
  res.status(201).json(project);
};


