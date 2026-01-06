const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Task = sequelize.define('task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('Todo', 'In Progress', 'Under Review', 'Done'),
        defaultValue: 'Todo'
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High')
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    underscored: true,
    timestamps: true
});

module.exports = Task;