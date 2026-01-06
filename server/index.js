const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { syncDB } = require("./models/Relations");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

syncDB();

app.get("/", (req, res) => {
  res.send("Task Manager API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
