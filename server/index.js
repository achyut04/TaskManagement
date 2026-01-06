const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const { syncDB } = require("./models/Relations");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", authRoutes);

syncDB();

app.get("/", (req, res) => {
  res.send("Task Manager API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
