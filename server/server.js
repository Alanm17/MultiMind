const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const chatController = require("./chatController");
const fileController = require("./fileController");
const { getAgents } = require("./agents/runAgents");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const agentTaskRoutes = require("./routes/agentTaskRoutes");
const chatRoutes = require("./routes/chatRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const streamController = require("./controllers/streamController");
const orchestrationRoutes = require("./routes/orchestrationRoutes");
const http = require("http");
const socketIo = require("socket.io");
const fileRoutes = require("./routes/fileRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
app.set("io", io);
app.use(cors());
app.use(express.json());

// Chat Routes
app.post("/api/chat", chatController.handleChat);

// File Routes
app.get("/api/files", fileController.getFiles);
app.post("/api/files/upload", fileController.uploadFile);
app.use("/api/files", fileRoutes);

// Agent Routes
app.get("/api/agents", (req, res) => {
  const agents = getAgents();
  res.json({ agents });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Session Routes
app.use("/api/sessions", sessionRoutes);

// Memory Routes
app.use("/api/memory", memoryRoutes);

// User Routes
app.use("/api/users", userRoutes);

// Project Routes
app.use("/api/projects", projectRoutes);

// Agent Task Routes
app.use("/api/agent-tasks", agentTaskRoutes);

// Chat Routes
app.use("/api/chat", chatRoutes);

// Orchestration Routes
app.use("/api/orchestration", orchestrationRoutes);

// Auth Routes
app.use("/api/auth", authRoutes);

// Stream Controller
app.use(streamController);

// Centralized error logging middleware
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
