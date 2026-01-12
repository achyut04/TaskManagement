const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  sendSuccess,
  sendError,
  sendInternalError,
} = require("../utils/responseHelper");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (user) {
      return sendError(
        res,
        "USER_ALREADY_EXISTS",
        "User already registered",
        null,
        400
      );
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const dbuser = await User.create({
      username,
      email,
      password: hashedPass,
      role: "User",
    });

    if (dbuser) {
      const userData = {
        id: dbuser.id,
        username: dbuser.username,
        email: dbuser.email,
        role: dbuser.role,
        token: generateToken(dbuser.id, dbuser.role),
      };
      return sendSuccess(
        res,
        userData,
        "User registered successfully",
        null,
        201
      );
    } else {
      return sendError(res, "INVALID_DATA", "Invalid user data", null, 400);
    }
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    console.log(user);

    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "No such user exists", null, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(
        res,
        "INVALID_CREDENTIALS",
        "Incorrect password",
        null,
        401
      );
    }

    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      token: generateToken(user.id, user.role),
    };

    return sendSuccess(res, userData, "Login successful");
  } catch (error) {
    return sendInternalError(res, error.message);
  }
};

module.exports = { register, login };
