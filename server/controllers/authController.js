const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const register = async (req, res) => {
  const { username, email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (user) res.status(400).json({ message: "User Already Registered" });

  const hashedPass = await bcrypt.hash(password, 10);

  const dbuser = await User.create({
    username,
    email,
    password: hashedPass,
    role: "User",
  });

  if (dbuser) {
    res.status(201).json({
      id: dbuser.id,
      username: dbuser.username,
      email: dbuser.email,
      role: dbuser.role,
      token: generateToken(dbuser.id, dbuser.role),
    });
  } else {
    res.status(400).json({ messsage: "Invalid Data" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) res.status(401).json({ message: "No such User exists." });
  else if (!(await bcrypt.compare(password, user.password)))
    res.status(401).json({ message: "Incorrect Password" });
  else {
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      token: generateToken(user.id, user.role),
    });
  }
};

module.exports = { register, login };
