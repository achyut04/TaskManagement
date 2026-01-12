const Comment = require("../models/Comment");
const User = require("../models/User");
const {
  sendSuccess,
  sendInternalError,
} = require("../utils/responseHelper");

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await Comment.create({
      content,
      task_id: id,
      user_id: userId,
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: "author", attributes: ["id", "username"] }],
    });

    return sendSuccess(
      res,
      fullComment,
      "Comment added successfully",
      null,
      201
    );
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const getTaskComments = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      where: { task_id: id },
      include: [{ model: User, as: "author", attributes: ["id", "username"] }],
      order: [["created_at", "DESC"]],
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

    return sendSuccess(
      res,
      {
        comments: rows,
        totalComments: count,
        page,
        hasMore: offset + rows.length < count,
      },
      "Comments retrieved successfully",
      meta
    );
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

module.exports = { addComment, getTaskComments };
