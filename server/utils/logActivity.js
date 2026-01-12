const ActivityLog = require("../models/ActivityLog");

const logActivity = async (taskId, userId, action, details) => {
  try {
    await ActivityLog.create({
      task_id: taskId,
      user_id: userId,
      action,
      details,
    });
  } catch (error) {
    console.error("Failed to log activity: ", error);
  }
};
