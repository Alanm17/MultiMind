const TaskDispatcher = require("./TaskDispatcher");
const ContextManager = require("./ContextManager");
const MessageBus = require("./MessageBus");
const WorkflowEngine = require("./WorkflowEngine");
const logger = require("./logger");

class Orchestrator {
  constructor(agentRegistry) {
    this.agentRegistry = agentRegistry;
    this.contextManager = new ContextManager();
    this.messageBus = new MessageBus();
    this.taskDispatcher = new TaskDispatcher(agentRegistry, this.messageBus);
    this.workflowEngine = new WorkflowEngine(
      this.taskDispatcher,
      this.contextManager,
      this.messageBus,
      agentRegistry
    );
  }

  /**
   * Entry point: orchestrate a high-level project goal.
   * @param {string} projectGoal - The user's high-level input.
   */
  async orchestrate(projectGoal) {
    logger.info("Orchestration started for goal:", projectGoal);
    // 1. Task Dispatcher breaks down the goal
    const tasks = await this.taskDispatcher.dispatch(projectGoal);
    // 2. Workflow Engine executes the workflow
    await this.workflowEngine.run(tasks, this.contextManager);
    logger.info("Orchestration complete.");
  }
}

module.exports = Orchestrator;
