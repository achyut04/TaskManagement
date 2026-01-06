const express = require("express");
const router = express.Router();
const { getAllUsers, promoteUser } = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/",getAllUsers);

router.put("/:id/promote",promoteUser);

module.exports = router;
