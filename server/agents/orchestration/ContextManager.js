const logger = require("./logger");
const projectService = require("../../services/projectService");

class ContextManager {
  constructor() {
    this.state = {
      files: {},
      messages: [],
      taskStatuses: {},
    };
  }

  updateFile(path, content) {
    this.state.files[path] = content;
    logger.debug("File updated:", path);
  }

  addMessage(message) {
    this.state.messages.push(message);
    logger.debug("Message added:", message);
  }

  setTaskStatus(taskId, status) {
    this.state.taskStatuses[taskId] = status;
    logger.debug(`Task ${taskId} status:`, status);
  }

  async updateFileFromAPI(filePath, content) {
    await projectService.updateFile(filePath, content);
    this.state.files[filePath] = content;
  }

  async fetchProjectState(projectId) {
    const state = await projectService.getProjectState(projectId);
    this.state = { ...this.state, ...state };
  }

  getContextForAgent(agentName) {
    return { ...this.state };
  }
}

module.exports = ContextManager;
