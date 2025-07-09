const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const jwt = require("jsonwebtoken");
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

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", auth, userController.me);
router.get("/by-email", authMiddleware, userController.findByEmail);

module.exports = router;
