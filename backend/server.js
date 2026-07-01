const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// 🔥 MUST be FIRST middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://taskmanagement-system-ihknxgokt-betsy-george-s-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight
app.options("*", cors());

// Middleware
app.use(express.json());

// DB connection
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/users", require("./routes/users"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Task Management API", status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});