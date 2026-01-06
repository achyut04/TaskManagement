const express = require("express");
const router = express.Router();
const { getAllUsers, promoteUser } = require("../controllers/projectController");
const { protect, admin } = require("../middleware/authMiddleware");



module.exports = router;