const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");

// Session routes
router.get("/", sessionController.getSessions);
router.get("/:sessionId/messages", sessionController.getMessages);
router.post("/", sessionController.createSession);
router.delete("/:sessionId", sessionController.deleteSession);
router.post("/:sessionId/rename", sessionController.renameSession);
router.post("/:sessionId/messages", sessionController.addMessage);

module.exports = router;
