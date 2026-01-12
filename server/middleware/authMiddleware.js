const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendUnauthorized, sendForbidden } = require("../utils/responseHelper");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
      
      if (!req.user) {
        return sendUnauthorized(res, "User not found");
      }
      
      next();
    } catch (error) {
      return sendUnauthorized(res, "Invalid or expired token");
    }
  } else {
    return sendUnauthorized(res, "Not authorized, no token");
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    return sendForbidden(res, "Not an admin type User");
  }
};

module.exports = {protect, admin};
