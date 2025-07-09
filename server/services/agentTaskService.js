const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createAgentTask(projectId, agentName, taskDescription, status) {
  return prisma.agentTask.create({
    data: { projectId, agentName, taskDescription, status },
  });
}

async function getAgentTasksByProject(projectId) {
  return prisma.agentTask.findMany({ where: { projectId } });
}

async function getAgentTaskById(id) {
  return prisma.agentTask.findUnique({ where: { id } });
}

async function updateAgentTask(id, updates) {
  return prisma.agentTask.update({ where: { id }, data: updates });
}

async function deleteAgentTask(id) {
  return prisma.agentTask.delete({ where: { id } });
}

module.exports = {
  createAgentTask,
  getAgentTasksByProject,
  getAgentTaskById,
  updateAgentTask,
  deleteAgentTask,
};
