const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createProject(userId, name) {
  return prisma.project.create({ data: { userId, name } });
}
async function ensureProject({ id, name, userId }) {
  return prisma.project.upsert({
    where: { id },
    update: {}, // do nothing if exists
    create: { id, name: name || "Untitled Project", userId },
  });
}

async function getProjectsByUser(userId) {
  return prisma.project.findMany({ where: { userId } });
}

async function getProjectById(id) {
  return prisma.project.findUnique({ where: { id } });
}

async function updateProject(id, name) {
  return prisma.project.update({ where: { id }, data: { name } });
}

async function deleteProject(id) {
  return prisma.project.delete({ where: { id } });
}

module.exports = {
  createProject,
  getProjectsByUser,
  getProjectById,
  updateProject,
  ensureProject,
  deleteProject,
};
