const userService = require("../services/userService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });
    const user = await userService.registerUser(email, password);
    res.status(201).json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });
    const { user, token } = await userService.loginUser(email, password);
    res.json({ user, token });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.findByEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await prisma.user.findUnique({
    where: { email: String(email) },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email });
};
