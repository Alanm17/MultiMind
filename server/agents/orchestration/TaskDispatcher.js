const callAgent = require("../callAgent");
const logger = require("./logger");

class TaskDispatcher {
  constructor(agentRegistry, messageBus) {
    this.agentRegistry = agentRegistry;
    this.messageBus = messageBus;
  }

  async dispatch(projectGoal) {
    logger.info("Dispatching tasks for goal:", projectGoal);
    // Use LLM to break down the goal
    const breakdownPrompt = [
      "You are a project manager. Break down the following project goal into actionable subtasks, assign each to the most suitable agent (Product Manager, Coder, Tester, Security, DevOps, etc.), and specify dependencies.",
      `Project goal: ${projectGoal}`,
      "Return the result as a JSON array of tasks with fields: id, type, agent, input, dependsOn (array of ids).",
    ];
    const llmResult = await callAgent({
      model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
      prompt: breakdownPrompt,
      context: {},
    });
    let tasks;
    try {
      tasks = JSON.parse(llmResult.choices[0].message.content);
    } catch (e) {
      throw new Error("Failed to parse LLM task breakdown: " + e.message);
    }
    for (const task of tasks) {
      this.messageBus.registerTask(task);
    }
    return tasks;
  }
}

module.exports = TaskDispatcher;
