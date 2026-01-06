const { sequelize } = require("../config/db");
const User = require("./User");
const Project = require("./Project");
const Task = require("./Task");

User.hasMany(Project, { foreignKey: "creator_id" });
Project.belongsTo(User, { as: "creator", foreignKey: "creator_id" });

Project.belongsToMany(User, { as: "members", through: "project_members" });
User.belongsToMany(Project, {
  as: "member_projects",
  through: "project_members",
});

Project.hasMany(Task, { foreignKey: "project_id", onDelete: "CASCADE" });
Task.belongsTo(Project, { foreignKey: "project_id" });

User.hasMany(Task, { foreignKey: "creator_id" });
Task.belongsTo(User, { as: "creator", foreignKey: "creator_id" });

User.hasMany(Task, { foreignKey: "assigned_to_id" });
Task.belongsTo(User, { as: "assignee", foreignKey: "assigned_to_id" });

const syncDB = async () => {
  try {
    await sequelize.sync({ force: false, alter: true });
    console.log("Database Synced");
  } catch (error) {
    console.error("Error syncing database: ", error);
  }
};

module.exports = { User, Project, Task, syncDB };
