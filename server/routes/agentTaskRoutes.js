const express = require("express");
const router = express.Router();
const agentTaskController = require("../controllers/agentTaskController");
const jwt = require("jsonwebtoken");
const {
  orchestrateAgentWorkflow,
  orchestrateAdvancedAgentWorkflow,
} = require("../controllers/agentTaskController");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// JWT auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/", auth, agentTaskController.create);
router.get("/", auth, agentTaskController.list);
router.get("/:id", auth, agentTaskController.get);
router.put("/:id", auth, agentTaskController.update);
router.delete("/:id", auth, agentTaskController.remove);
router.post("/orchestrate", orchestrateAgentWorkflow);
router.post("/orchestrate-advanced", orchestrateAdvancedAgentWorkflow);

module.exports = router;
