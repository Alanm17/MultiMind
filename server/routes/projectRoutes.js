const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");

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

router.post("/", auth, projectController.create);
router.get("/", projectController.list);
router.get("/:id", projectController.get);
router.put("/:id", auth, projectController.update);
router.delete("/:id", auth, projectController.remove);
router.get("/:id/download", auth, projectController.downloadProjectZip);
router.post("/:projectId/members", authMiddleware, projectController.addMember);
router.get(
  "/:projectId/members",
  authMiddleware,
  projectController.listMembers
);
router.delete(
  "/:projectId/members/:userId",
  authMiddleware,
  projectController.removeMember
);

module.exports = router;
