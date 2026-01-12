const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Comment = sequelize.define(
  "comments",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    underscored: true,
    timestamps: true,
  }
);

module.exports = Comment;
