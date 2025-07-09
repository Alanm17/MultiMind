// Enhanced agent registry with validation and CRUD agents
class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.loadAgents();
  }

  loadAgents() {
    // Core agents
    const defaultAgents = {
      "Product Manager Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a product manager. Break down high-level goals into actionable tasks and coordinate the team.",
        capabilities: ["planning", "coordination", "requirements"],
        maxTokens: 4000,
      },
      "Database Designer Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a database designer. Create efficient database schemas with proper relationships, constraints, and indexes for CRUD applications.",
        capabilities: [
          "database-design",
          "schema-creation",
          "relationships",
          "migrations",
        ],
        maxTokens: 4000,
      },
      "Coder Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are an expert software developer. Write clean, efficient, and well-documented code.",
        capabilities: ["coding", "debugging", "refactoring"],
        maxTokens: 8000,
      },
      "API Designer Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are an API designer. Create RESTful API endpoints with proper HTTP methods, status codes, and request/response formats for CRUD operations.",
        capabilities: [
          "api-design",
          "rest-endpoints",
          "openapi-spec",
          "validation",
        ],
        maxTokens: 4000,
      },
      "Tester Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a QA engineer. Create comprehensive test plans and identify bugs.",
        capabilities: ["testing", "validation", "quality-assurance"],
        maxTokens: 4000,
      },
      "Security Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a security expert. Review code for vulnerabilities and best practices.",
        capabilities: ["security", "vulnerability-analysis", "best-practices"],
        maxTokens: 4000,
      },
      "Performance Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a performance engineer. Review code for performance bottlenecks and optimizations.",
        capabilities: ["performance", "optimization", "profiling"],
        maxTokens: 4000,
      },
      "Compliance Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a compliance officer. Review code for legal, regulatory, and organizational compliance.",
        capabilities: ["compliance", "regulations", "governance"],
        maxTokens: 3000,
      },
      "UX Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a UX expert. Review code for usability and accessibility.",
        capabilities: ["ux", "accessibility", "usability"],
        maxTokens: 3000,
      },
      "Reviewer Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a code reviewer. Provide comprehensive feedback and approve or request changes.",
        capabilities: ["review", "feedback", "approval"],
        maxTokens: 6000,
      },
      "File Manager Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a file manager. Organize and manage project files.",
        capabilities: ["file-management", "organization"],
        maxTokens: 3000,
      },
      "Documenter Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a documenter. Write clear and concise documentation.",
        capabilities: ["documentation", "explanation"],
        maxTokens: 3000,
      },
      "DevOps Agent": {
        model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
        systemMessage:
          "You are a DevOps engineer. Set up deployment and CI/CD pipelines.",
        capabilities: ["devops", "deployment", "ci-cd"],
        maxTokens: 4000,
      },
    };
    Object.entries(defaultAgents).forEach(([name, config]) => {
      this.agents.set(name, config);
    });
    // Optionally load from AGENT_CONFIGS or external config
  }

  generateAgentId(name) {
    return name.toLowerCase().replace(/\s+/g, "-");
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  getAllAgents() {
    return Array.from(this.agents.entries()).map(([name, config]) => ({
      name,
      ...config,
    }));
  }

  updateAgentStats(name, responseTime, success) {
    // Optionally track agent performance
  }
}

module.exports = { AgentRegistry };
