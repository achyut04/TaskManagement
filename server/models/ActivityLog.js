const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ActivityLog = sequelize.define(
  "activity_log",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    underscored: true,
    timestamps: true,
  }
);

module.exports = ActivityLog;
