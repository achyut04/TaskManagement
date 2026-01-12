const Comment = require("../models/Comment");
const User = require("../models/User");

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

    res.status(201).json(fullComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await Comment.findAll({
      where: { task_id: id },
      include: [{ model: User, as: "author", attributes: ["id", "username"] }],
      order: [["created_at", "ASC"]],
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addComment, getTaskComments };
