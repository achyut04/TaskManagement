const multer = require("multer");
const path = require("path");
const fs = require("fs");
const FileAttachment = require("../models/FileAttachment");
const Task = require("../models/Task");
const User = require("../models/User");
const {
  sendSuccess,
  sendNotFound,
  sendForbidden,
  sendError,
  sendInternalError,
} = require("../utils/responseHelper");

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

const uploadMiddleware = upload.single("file");

const uploadFile = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(
          res,
          "FILE_TOO_LARGE",
          "File size exceeds 10MB limit",
          null,
          400
        );
      }
      return sendInternalError(res, err.message);
    }

    try {
      const taskId = req.params.id;

      if (!req.file) {
        return sendError(res, "NO_FILE", "No file provided", null, 400);
      }

      const task = await Task.findByPk(taskId);
      if (!task) {
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return sendNotFound(res, "Task");
      }

      const fileAttachment = await FileAttachment.create({
        task_id: taskId,
        user_id: req.user.id,
        filename: req.file.filename,
        original_filename: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
      });

      const attachmentWithUser = await FileAttachment.findByPk(
        fileAttachment.id,
        {
          include: [
            { model: User, as: "uploader", attributes: ["id", "username"] },
          ],
        }
      );

      return sendSuccess(
        res,
        attachmentWithUser,
        "File uploaded successfully",
        null,
        201
      );
    } catch (error) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return sendInternalError(res, error.message);
    }
  });
};

const getTaskFiles = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return sendNotFound(res, "Task");
    }

    const files = await FileAttachment.findAll({
      where: { task_id: taskId },
      include: [
        { model: User, as: "uploader", attributes: ["id", "username"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return sendSuccess(res, files, "Files retrieved successfully");
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileAttachment = await FileAttachment.findByPk(fileId, {
      include: [{ model: Task }],
    });

    if (!fileAttachment) {
      return sendNotFound(res, "File");
    }

    const task = await Task.findByPk(fileAttachment.task_id);
    if (!task) {
      return sendNotFound(res, "Task");
    }

    if (
      req.user.role !== "Admin" &&
      fileAttachment.user_id !== req.user.id &&
      task.creator_id !== req.user.id
    ) {
      return sendForbidden(res, "Not authorized to delete this file");
    }

    if (fs.existsSync(fileAttachment.file_path)) {
      fs.unlinkSync(fileAttachment.file_path);
    }

    await fileAttachment.destroy();

    return sendSuccess(res, null, "File deleted successfully", null, 204);
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileAttachment = await FileAttachment.findByPk(fileId, {
      include: [{ model: Task }],
    });

    if (!fileAttachment) {
      return sendNotFound(res, "File");
    }

    if (!fs.existsSync(fileAttachment.file_path)) { 
      return sendNotFound(res, "File");
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(
        fileAttachment.original_filename
      )}"`
    );
    res.setHeader("Content-Type", fileAttachment.mime_type);

    return res.sendFile(path.resolve(fileAttachment.file_path));
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

module.exports = {
  uploadFile,
  getTaskFiles,
  deleteFile,
  downloadFile,
};
