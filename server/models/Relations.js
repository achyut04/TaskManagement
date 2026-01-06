const { sequelize } = require("../config/db");
const User = require("./User");
const Project = require("./Project");
const Task = require("./Task");

User.hasMany(Project, { foreignKey: "createdById" });
Project.belongsTo(User, { as: "creator", foreignKey: "createdById" });

Project.belongsToMany(User, { as: "members", through: "ProjectMembers" });
User.belongsToMany(Project, {
  as: "memberProjects",
  through: "ProjectMembers",
});

Project.hasMany(Task, { foreignKey: "projectId", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "projectId" });

User.hasMany(Task, { foreignKey: "createdById" });
Task.belongsTo(User, { as: "creator", foreignKey: "createdById" });

User.hasMany(Task, { foreignKey: "assignedToId" });
Task.belongsTo(User, { as: "assignee", foreignKey: "assignedToId" });

const syncDB = async () => {
  try {
    await sequelize.sync({ force: false, alter: true });
    console.log("Database Synced");
  } catch (error) {
    console.error("Error syncing database: ", error);
  }
};

module.exports = { User, Project, Task, syncDB };
