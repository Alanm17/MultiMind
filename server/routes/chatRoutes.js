const express = require("express");
const router = express.Router();
const chatController = require("../chatController");

// Existing chat route
router.post("/", chatController.handleChat);

// Full agent-to-agent workflow route
router.post("/workflow", chatController.handleAgentWorkflow);

// New streaming chat route
router.post("/stream", chatController.handleChatStream);

module.exports = router;
