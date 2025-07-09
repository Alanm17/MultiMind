const express = require("express");
const router = express.Router();
const memoryController = require("../controllers/memoryController");

// Memory routes
router.get("/:sessionId", memoryController.getMemory);
router.post("/:sessionId", memoryController.updateMemory);

module.exports = router;
