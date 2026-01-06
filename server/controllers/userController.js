const User = require("../models/User");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const promoteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (user) {
      user.role = "Admin";
      await user.save();
      res.json({ message: `User ${user.username} is now an Admin` });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, promoteUser };
