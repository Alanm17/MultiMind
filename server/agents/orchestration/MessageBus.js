const logger = require("./logger");

class MessageBus {
  constructor() {
    this.tasks = {};
    this.listeners = {};
  }

  registerTask(task) {
    this.tasks[task.id] = task;
    logger.info("Task registered:", task);
  }

  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  emit(event, payload) {
    logger.debug("Event emitted:", event, payload);
    if (this.listeners[event]) {
      for (const handler of this.listeners[event]) {
        handler(payload);
      }
    }
  }

  sendToAgent(agentName, message) {
    this.emit(`agent:${agentName}`, message);
  }

  receiveFromAgent(agentName, handler) {
    this.on(`agent:${agentName}`, handler);
  }
}

module.exports = MessageBus;
