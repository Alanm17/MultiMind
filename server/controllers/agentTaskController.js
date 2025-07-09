const agentTaskService = require("../services/agentTaskService");
const projectService = require("../services/projectService");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Async wrapper to catch errors and pass to Express error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper to get project and check ownership
async function getAuthorizedProject(projectId, userId) {
  const project = await projectService.getProjectById(projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }
  if (project.userId !== userId) {
    const err = new Error("Forbidden: Not authorized for this project");
    err.statusCode = 403;
    throw err;
  }
  return project;
}

exports.create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { projectId, agentName, taskDescription, status } = req.body;

  if (!projectId || !agentName || !taskDescription || !status) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  await getAuthorizedProject(projectId, userId);

  const task = await agentTaskService.createAgentTask(
    projectId,
    agentName,
    taskDescription,
    status
  );

  res.status(201).json({ task });
});

exports.list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: "projectId required" });
  }

  await getAuthorizedProject(projectId, userId);

  const tasks = await agentTaskService.getAgentTasksByProject(projectId);
  res.json({ tasks });
});

exports.get = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const task = await agentTaskService.getAgentTaskById(id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  await getAuthorizedProject(task.projectId, userId);

  res.json({ task });
});

exports.update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const updates = req.body;

  const task = await agentTaskService.getAgentTaskById(id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  await getAuthorizedProject(task.projectId, userId);

  const updated = await agentTaskService.updateAgentTask(id, updates);
  res.json({ task: updated });
});

exports.remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const task = await agentTaskService.getAgentTaskById(id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  await getAuthorizedProject(task.projectId, userId);

  await agentTaskService.deleteAgentTask(id);
  res.json({ success: true });
});

exports.orchestrateAgentWorkflow = asyncHandler(async (req, res) => {
  const { message, agentChain, chatId, projectId, context } = req.body;

  if (!message || !Array.isArray(agentChain) || agentChain.length === 0) {
    return res.status(400).json({ error: "Missing message or agentChain" });
  }

  const { runAgentWorkflow } = require("../agents/runAgents");
  const result = await runAgentWorkflow({
    message,
    agentChain,
    chatId,
    projectId,
    context,
  });

  res.json(result);
});

// Advanced orchestrator controller
exports.orchestrateAdvancedAgentWorkflow = async function (req, res) {
  try {
    const { message, chatId, projectId, context } = req.body;
    if (!message || !chatId || !projectId) {
      return res
        .status(400)
        .json({ error: "Missing message, chatId, or projectId" });
    }
    const { runAdvancedAgentWorkflow } = require("../agents/runAgents");
    const result = await runAdvancedAgentWorkflow({
      message,
      chatId,
      projectId,
      context,
    });
    res.json(result);
  } catch (error) {
    console.error("Advanced Orchestrator error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// Express error handling middleware example (add in your app.js or server.js)
// app.use((err, req, res, next) => {
//   console.error(err);
//   const status = err.statusCode || 500;
//   res.status(status).json({ error: err.message || "Internal server error" });
// });

module.exports = {
  create: exports.create,
  list: exports.list,
  get: exports.get,
  update: exports.update,
  remove: exports.remove,
  orchestrateAgentWorkflow: exports.orchestrateAgentWorkflow,
  orchestrateAdvancedAgentWorkflow: exports.orchestrateAdvancedAgentWorkflow,
};
