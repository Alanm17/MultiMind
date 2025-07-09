// Enhanced workflow configuration with CRUD-specific agents
const AGENT_WORKFLOW_CONFIG = {
  productManager: {
    priority: 1,
    dependencies: [],
    maxRetries: 2,
    timeout: 30000,
  },
  databaseDesigner: {
    priority: 2,
    dependencies: ["productManager"],
    maxRetries: 2,
    timeout: 30000,
  },
  coder: {
    priority: 3,
    dependencies: ["productManager", "databaseDesigner"],
    maxRetries: 3,
    timeout: 45000,
  },
  apiDesigner: {
    priority: 4,
    dependencies: ["coder"],
    maxRetries: 2,
    timeout: 30000,
  },
  parallel: {
    priority: 5,
    dependencies: ["coder", "apiDesigner"],
    agents: ["tester", "security", "performance", "compliance", "ux"],
    maxRetries: 2,
    timeout: 60000,
  },
  reviewer: {
    priority: 6,
    dependencies: ["parallel"],
    maxRetries: 2,
    timeout: 30000,
  },
  fileManager: {
    priority: 7,
    dependencies: ["reviewer"],
    maxRetries: 2,
    timeout: 20000,
  },
  documenter: {
    priority: 8,
    dependencies: ["fileManager"],
    maxRetries: 1,
    timeout: 25000,
  },
  devOps: {
    priority: 9,
    dependencies: ["documenter"],
    maxRetries: 2,
    timeout: 35000,
  },
};

module.exports = { AGENT_WORKFLOW_CONFIG };
