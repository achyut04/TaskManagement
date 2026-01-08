const cron = require("node-cron");
const { Op } = require("sequelize");
const Task = require("../models/Task");

const startOverdueJob = (io) => {
  cron.schedule("* * * * *", async () => {
    console.log("running Overdue Task check.");
    try {
      const now = new Date();
      const overdueTasks = await Task.findAll({
        where: {
          due_date: {
            [Op.lt]: now,
          },
          status: {
            [Op.notIn]: ["Done", "Overdue"],
          },
        },
      });

      if (overdueTasks.length > 0) {
        const ids = overdueTasks.map((t) => t.id);
        await Task.update({ status: "Overdue" }, { where: { id: ids } });
      }
    } catch (error) {
        console.error("Error in Overdue job", error);
    }
  });
};

module.exports = startOverdueJob;