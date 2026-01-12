const { sequelize } = require("../config/db");
const User = require("./User");
const Project = require("./Project");
const Task = require("./Task");
const Comment = require("./Comment");
const ActivityLog = require("./ActivityLog" );

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

Task.hasMany(Comment, { foreignKey: "task_id" });
Comment.belongsTo(Task, { foreignKey: "task_id" });

User.hasMany(Comment, { foreignKey: "user_id" });
Comment.belongsTo(User, { foreignKey: "user_id", as: "author" });

Task.hasMany(ActivityLog, { foreignKey: "task_id" });
ActivityLog.belongsTo(Task, { foreignKey: "task_id" });

User.hasMany(ActivityLog, { foreignKey: "user_id" });
ActivityLog.belongsTo(User, { foreignKey: "user_id", as: "actor" });

const syncDB = async () => {
  try {
    await sequelize.sync({ force: false, alter: true });
    console.log("Database Synced");
  } catch (error) {
    console.error("Error syncing database: ", error);
  }
};

module.exports = { User, Project, Task, syncDB };
