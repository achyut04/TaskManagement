const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });
    next();
  }
  if (!token) {
    res.status(401).json({ message: "Not Authorized" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role == "Admin") next();
  else res.status(401).json({ message: "Not an admin type User." });
};

module.exports = {protect, admin};
