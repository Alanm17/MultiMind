const express = require("express");
const router = express.Router();
const fileController = require("../fileController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/:projectId/tree", fileController.getTree);
router.get("/:projectId/file", fileController.getFile); // ?path=...
router.post("/:projectId/file", fileController.createFile);
router.put("/:projectId/file", fileController.updateFile);
router.delete("/:projectId/file", fileController.deleteFile);
router.post("/:projectId/folder", fileController.createFolder);
router.put("/:projectId/folder", fileController.renameFolder);
router.delete("/:projectId/folder", fileController.deleteFolder);

module.exports = router;
