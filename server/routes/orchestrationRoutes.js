const express = require("express");
const router = express.Router();
const orchestrationController = require("../controllers/orchestrationController");
const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/orchestrate",
  authMiddleware,
  orchestrationController.handleOrchestration
);

module.exports = router;
