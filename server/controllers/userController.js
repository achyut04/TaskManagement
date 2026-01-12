const { Op } = require("sequelize");
const User = require("../models/User");
const {
  sendSuccess,
  sendNotFound,
  sendInternalError,
} = require("../utils/responseHelper");

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      order: [
        ["role", "DESC"],
        ["username", "ASC"],
      ],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    const meta = {
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count,
        perPage: limit,
      },
    };

    return sendSuccess(res, users, "Users retrieved successfully", meta);
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const promoteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return sendNotFound(res, "User");
    }

    user.role = "Admin";
    await user.save();
    return sendSuccess(
      res,
      { id: user.id, username: user.username, role: user.role },
      `User ${user.username} is now an Admin`
    );
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

module.exports = { getAllUsers, promoteUser };
