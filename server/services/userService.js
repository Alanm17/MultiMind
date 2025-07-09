const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

async function registerUser(email, password) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });
  return user;
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return { user, token };
}

async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

module.exports = { registerUser, loginUser, getUserById };
