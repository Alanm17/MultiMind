const { AgentRegistry } = require("./agentRegistry");
const { AGENT_WORKFLOW_CONFIG } = require("./workflowConfig");
const { CRUD_APP_TEMPLATES } = require("./crudTemplates");
const { ContextManager } = require("./contextManager");
const {
  CRUDFileGenerator,
  ProjectDownloadGenerator,
} = require("./fileGenerator");
const { CRUDPromptBuilder } = require("./promptBuilder");
const {
  WorkflowOrchestrator,
  WorkflowExecution,
} = require("./workflowOrchestrator");
const { APIClient } = require("./apiClient");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

// Main entry points
function getAgents() {
  const registry = new AgentRegistry();
  return registry.getAllAgents();
}

async function runAgents({ message, activeAgents, chatId, ...rest }) {
  // Pass chatId and any other params to the orchestrator
  const orchestrator = new WorkflowOrchestrator();
  const result = await orchestrator.executeWorkflow({
    message,
    activeAgents,
    chatId,
    ...rest,
  });
  // Defensive: always return { responses: [], files: [] }
  if (!result || typeof result !== "object") {
    return { responses: [], files: [] };
  }
  // Try to extract responses and files from result
  let responses = [];
  let files = [];
  if (Array.isArray(result.responses)) {
    responses = result.responses;
  } else if (result.results) {
    // Flatten responses from results object if present
    responses = Object.values(result.results).flatMap((r) =>
      r && r.response ? [r.response] : []
    );
  }
  if (Array.isArray(result.files)) {
    files = result.files;
  }
  return { responses, files };
}

async function runAgentWorkflow({
  message,
  agentChain,
  chatId,
  projectId,
  context,
}) {
  // Implement logic to run a specific agent workflow
  const orchestrator = new WorkflowOrchestrator();
  return orchestrator.executeWorkflow({
    message,
    agentChain,
    chatId,
    projectId,
    context,
  });
}
async function runAgentsStream({
  message,
  activeAgents,
  chatId,
  onToken,
  ...rest
}) {
  const orchestrator = new WorkflowOrchestrator();
  const result = await orchestrator.executeWorkflowStream({
    message,
    activeAgents,
    chatId,
    ...rest,
    onToken,
  });
  return result; // usually undefined or some metadata, since streaming is done via onToken callback
}
async function runAdvancedAgentWorkflow(params) {
  // Implement logic for advanced workflows
  const orchestrator = new WorkflowOrchestrator();
  return orchestrator.executeWorkflow(params);
}

module.exports = {
  getAgents,
  runAgents,
  runAgentsStream,
  runAgentWorkflow,
  runAdvancedAgentWorkflow,
};
