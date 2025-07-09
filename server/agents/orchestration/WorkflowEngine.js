const logger = require("./logger");
const callAgent = require("../callAgent");

class WorkflowEngine {
  constructor(taskDispatcher, contextManager, messageBus, agentRegistry) {
    this.taskDispatcher = taskDispatcher;
    this.contextManager = contextManager;
    this.messageBus = messageBus;
    this.agentRegistry = agentRegistry;
  }

  async run(tasks, contextManager) {
    logger.info("Workflow execution started.");
    const completed = new Set();
    const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));
    const pending = new Set(tasks.map((t) => t.id));
    // Listen for task completion
    this.messageBus.on("task:completed", ({ taskId }) => {
      completed.add(taskId);
      pending.delete(taskId);
      this.tryStartTasks(tasks, completed, contextManager);
    });
    // Start tasks with no dependencies
    this.tryStartTasks(tasks, completed, contextManager);
    // Wait for all tasks to complete
    while (pending.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    logger.info("Workflow execution complete.");
  }

  tryStartTasks(tasks, completed, contextManager) {
    for (const task of tasks) {
      if (completed.has(task.id)) continue;
      if (task._started) continue;
      if (task.dependsOn && !task.dependsOn.every((dep) => completed.has(dep)))
        continue;
      task._started = true;
      this.executeTask(task, contextManager);
    }
  }

  async executeTask(task, contextManager) {
    logger.info(`Executing task ${task.id} by ${task.agent}`);
    const agentContext = contextManager.getContextForAgent(task.agent);
    const agentInput = {
      model: this.agentRegistry.getAgent(task.agent).model,
      prompt: [task.input],
      context: agentContext,
    };
    try {
      const agentResult = await callAgent(agentInput);
      contextManager.addMessage({ agent: task.agent, result: agentResult });
      contextManager.setTaskStatus(task.id, "done");
      this.messageBus.emit("task:completed", {
        taskId: task.id,
        result: agentResult,
      });
    } catch (e) {
      logger.error(`Task ${task.id} by ${task.agent} failed:`, e);
      contextManager.setTaskStatus(task.id, "failed");
      this.messageBus.emit("task:failed", { taskId: task.id, error: e });
    }
  }
}

module.exports = WorkflowEngine;
