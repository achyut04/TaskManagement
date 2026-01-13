const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { syncDB } = require("./models/Relations");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const { protect, admin } = require("./middleware/authMiddleware");
const startOverdueJob = require("./jobs/checkOverdueTasks");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", authRoutes);
startOverdueJob();

syncDB();

app.use("/api/users", protect, admin, userRoutes);
app.use("/api/project", protect, projectRoutes);
app.use("/api/tasks", protect, taskRoutes);

app.get("/", (req, res) => {
  res.send("Task Manager API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
