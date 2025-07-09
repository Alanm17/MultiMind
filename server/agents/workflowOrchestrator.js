const { AGENT_WORKFLOW_CONFIG } = require("./workflowConfig");
const { AgentRegistry } = require("./agentRegistry");
const { APIClient } = require("./apiClient");
const { PrismaClient } = require("@prisma/client");
const contextManager = require("./contextManager");

// Utility to get last 3 user messages for a session
async function getPrompt(prisma, chatId) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: chatId },
    orderBy: { createdAt: "asc" },
  });
  const userMessages = messages
    .filter((m) => m.role === "user" && m.content && m.content.length > 3)
    .map((m) => m.content);
  return userMessages.slice(-3);
}

class WorkflowOrchestrator {
  constructor() {
    this.agentRegistry = new AgentRegistry();
    if (!WorkflowOrchestrator.prisma) {
      WorkflowOrchestrator.prisma = new PrismaClient();
    }
    this.prisma = WorkflowOrchestrator.prisma;
  }

  async executeWorkflow({
    message,
    chatId,
    projectId,
    context: initialContext = {},
    appType = null,
    agentChain = null,
    activeAgents = null,
  }) {
    // --- Inject recent chat memory ---
    let recentUserMessages = [];
    if (chatId) {
      // Load last 50 messages for this chat session, ordered oldest to newest
      const recentMessages = await this.prisma.chatMessage.findMany({
        where: { sessionId: chatId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      // Reverse to get oldest to newest
      recentMessages.reverse();
      for (const msg of recentMessages) {
        if (msg.role === "user" && msg.content && msg.content.length > 10) {
          recentUserMessages.push(msg.content);
        }
      }
    }
    // --- Context switch logic ---
    let contextSwitch = null;
    let isRelated = null;
    const prevMessage =
      recentUserMessages.length > 0
        ? recentUserMessages[recentUserMessages.length - 1]
        : null;
    if (prevMessage) {
      contextSwitch = contextManager.decideContextSwitch(message, prevMessage);
      isRelated = contextSwitch === "same topic";
    }
    // Build context with only feedback for now
    let context = {
      feedback: recentUserMessages,
      chatId, // Ensure chatId is always included in context
      contextSwitch,
      isRelated,
    };
    console.log("DEBUG: FINAL AGENT CONTEXT", context);
    // Determine workflow phases
    let phases = Object.keys(AGENT_WORKFLOW_CONFIG).sort(
      (a, b) =>
        AGENT_WORKFLOW_CONFIG[a].priority - AGENT_WORKFLOW_CONFIG[b].priority
    );
    if (agentChain) phases = agentChain;
    if (activeAgents) phases = activeAgents;
    const workflowResults = {};
    for (const phase of phases) {
      const config = AGENT_WORKFLOW_CONFIG[phase] || {};
      if (phase === "parallel" && config.agents) {
        // Parallel phase: run all agents in parallel
        const results = await this.executeParallelPhase(context, config);
        workflowResults[phase] = results;
        // Optionally merge results into context
        context = { ...context, ...results };
      } else {
        // Single agent phase
        const result = await this.executeSingleAgentPhase(
          context,
          phase,
          config
        );
        workflowResults[phase] = result;
        // Optionally merge result into context
        context = { ...context, ...result };
      }
    }
    return { results: workflowResults, contextSwitch, isRelated };
  }

  async executePhase(context, phase) {
    const config = AGENT_WORKFLOW_CONFIG[phase];
    if (phase === "parallel" && config.agents) {
      return this.executeParallelPhase(context, config);
    } else {
      return this.executeSingleAgentPhase(context, phase, config);
    }
  }

  async executeParallelPhase(context, config) {
    const agentNames = config.agents;
    const promises = agentNames.map(async (agentName) => {
      try {
        const result = await this.executeSingleAgentPhase(
          context,
          agentName,
          config
        );
        // Assume executeSingleAgentPhase returns { response, prompt, context } or { error }
        return { agent: agentName, ...result };
      } catch (error) {
        console.error(`[ParallelPhase] Agent ${agentName} failed:`, error);
        return {
          agent: agentName,
          error: error.message || error,
          prompt: null,
          context: null,
        };
      }
    });
    const results = await Promise.allSettled(promises);

    // Aggregate results, logging and including errors
    return results.reduce((acc, res) => {
      if (res.status === "fulfilled") {
        const { agent, response, prompt, context, error } = res.value;
        acc[agent] = error
          ? { error, prompt, context }
          : { response, prompt, context };
      } else {
        // Log and add rejected promise
        const { agent } = res.reason || {};
        console.error(
          `[ParallelPhase] Agent ${agent || "unknown"} promise rejected:`,
          res.reason
        );
        acc[agent || "unknown"] = {
          error: res.reason?.message || String(res.reason),
          prompt: null,
          context: null,
        };
      }
      return acc;
    }, {});
  }

  async executeSingleAgentPhase(context, phase, config) {
    const agent = this.agentRegistry.getAgent(this.getAgentFullName(phase));
    if (!agent) return { error: `Agent not found for phase: ${phase}` };

    // --- Build prompt from DB ---
    let prompt = [];
    if (context && context.chatId) {
      prompt = await getPrompt(this.prisma, context.chatId);
    }
    // TEMP: fallback to context.feedback if needed
    if (prompt.length === 0 && Array.isArray(context.feedback)) {
      prompt = context.feedback.filter(Boolean);
    }

    console.log("🚀 Prompt going to agent:", prompt);

    const apiClient = new APIClient(process.env.TOGETHER_API_KEY, null);
    const modelName = agent.model || phase;
    try {
      const response = await apiClient.callWithRetry(
        modelName,
        prompt,
        context,
        config.maxRetries || 2
      );
      return { response, prompt };
    } catch (error) {
      return { error: error.message || error, prompt };
    }
  }
  async executeWorkflowStream({
    message,
    chatId,
    projectId,
    context: initialContext = {},
    appType = null,
    agentChain = null,
    activeAgents = null,
    onToken,
  }) {
    // Step 1: gather context and feedback
    let recentUserMessages = [];
    if (chatId) {
      const recentMessages = await this.prisma.chatMessage.findMany({
        where: { sessionId: chatId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      recentMessages.reverse();
      for (const msg of recentMessages) {
        if (msg.role === "user" && msg.content && msg.content.length > 10) {
          recentUserMessages.push(msg.content);
        }
      }
    }

    let contextSwitch = null;
    let isRelated = null;
    const prevMessage =
      recentUserMessages.length > 0
        ? recentUserMessages[recentUserMessages.length - 1]
        : null;
    if (prevMessage) {
      contextSwitch = contextManager.decideContextSwitch(message, prevMessage);
      isRelated = contextSwitch === "same topic";
    }

    let context = {
      feedback: recentUserMessages,
      chatId,
      contextSwitch,
      isRelated,
    };

    let phases = Object.keys(AGENT_WORKFLOW_CONFIG).sort(
      (a, b) =>
        AGENT_WORKFLOW_CONFIG[a].priority - AGENT_WORKFLOW_CONFIG[b].priority
    );
    if (agentChain) phases = agentChain;
    if (activeAgents) phases = activeAgents;

    // For streaming, we assume 1 phase only (or stream just the last one)
    const lastPhase = phases[phases.length - 1];
    const config = AGENT_WORKFLOW_CONFIG[lastPhase];

    return await this.executeSingleAgentPhaseStream(
      context,
      lastPhase,
      config,
      onToken
    );
  }
  async executeSingleAgentPhaseStream(context, phase, config, onToken) {
    const agent = this.agentRegistry.getAgent(this.getAgentFullName(phase));
    if (!agent) return { error: `Agent not found for phase: ${phase}` };

    let prompt = [];
    if (context && context.chatId) {
      prompt = await getPrompt(this.prisma, context.chatId);
    }
    if (prompt.length === 0 && Array.isArray(context.feedback)) {
      prompt = context.feedback.filter(Boolean);
    }

    const apiClient = new APIClient(process.env.TOGETHER_API_KEY, null);
    const modelName = agent.model || phase;

    try {
      await apiClient.makeStreamingAPICall(
        modelName,
        prompt,
        context,
        onToken // 🔁 streaming callback
      );
      return { prompt };
    } catch (error) {
      return { error: error.message || error, prompt };
    }
  }

  buildPrompt(agentName, context, appType = null) {
    // Deprecated: now handled in executeSingleAgentPhase
    return context.feedback || [];
  }

  getAgentFullName(shortName) {
    // Map short phase names to full agent names if needed
    const mapping = {
      productManager: "Product Manager Agent",
      databaseDesigner: "Database Designer Agent",
      coder: "Coder Agent",
      apiDesigner: "API Designer Agent",
      tester: "Tester Agent",
      security: "Security Agent",
      performance: "Performance Agent",
      compliance: "Compliance Agent",
      ux: "UX Agent",
      reviewer: "Reviewer Agent",
      fileManager: "File Manager Agent",
      documenter: "Documenter Agent",
      devOps: "DevOps Agent",
    };
    return mapping[shortName] || shortName;
  }
}

class WorkflowExecution {
  constructor(message, chatId, projectId, initialContext, appType = null) {
    this.message = message;
    this.chatId = chatId;
    this.projectId = projectId;
    this.initialContext = initialContext;
    this.context = initialContext;
    this.appType = appType;
    this.results = {};
    if (!WorkflowExecution.prisma) {
      const { PrismaClient } = require("@prisma/client");
      WorkflowExecution.prisma = new PrismaClient();
    }
    this.prisma = WorkflowExecution.prisma;
  }

  addResult(agentName, content, prompt = "", context = {}) {
    this.results[agentName] = { content, prompt, context };
  }

  async saveToDatabase(agentName, content, prompt = "", context = {}) {
    // Implement save to DB logic if needed
  }

  getContext() {
    // Always include projectMemory from initialContext
    return {
      ...this.context,
      projectMemory: this.initialContext.projectMemory || {},
    };
  }

  isPhaseComplete(phase) {
    return !!this.results[phase];
  }

  needsRevision() {
    // Implement revision check if needed
    return false;
  }

  getResults() {
    return this.results;
  }

  async saveProjectMemory(projectId, key, value) {
    await this.prisma.projectMemory.upsert({
      where: { projectId_key: { projectId, key } },
      create: { projectId, key, value },
      update: { value },
    });
  }
}

module.exports = { WorkflowOrchestrator, WorkflowExecution };
