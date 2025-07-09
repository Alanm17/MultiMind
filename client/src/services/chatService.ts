import { apiRequest } from "../lib/api";

// ------------ Types ------------
export interface ChatRequest {
  chatId: string;
  message: string;
  activeAgents: string[];
  projectId: string;
}

export interface ChatResponse {
  success: boolean;
  messages: Array<{
    agentName: string;
    content: string;
  }>;
  files: Array<{
    filePath: string;
    content: string;
    agent: string;
  }>;
  metadata: {
    chatId: string;
    projectId: string;
    generatedFiles: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface WorkflowRequest {
  chatId: string;
  message: string;
  projectId: string;
  context?: Array<{ path: string; content: string; language: string }>;
}

// ------------ Helper ------------
export function getActiveAgentNames(
  agents: { id: string; name: string; isActive: boolean }[]
): string[] {
  return agents.filter((a) => a.isActive).map((a) => a.name);
}

// Helper to generate a canonical agent id from the agent name
function getAgentIdFromName(name: string): string {
  // Remove 'Agent' suffix, lowercase, replace spaces and special chars with '-'
  return name
    .replace(/\s*Agent$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type BackendAgent = {
  name: string;
  model: string;
  systemMessage: string;
  capabilities: string[];
  maxTokens: number;
};

// Mapping from full agent name to backend ID (camelCase)
const AGENT_NAME_TO_ID: Record<string, string> = {
  "Product Manager Agent": "productManager",
  "Database Designer Agent": "databaseDesigner",
  "Coder Agent": "coder",
  "API Designer Agent": "apiDesigner",
  "Tester Agent": "tester",
  "Security Agent": "security",
  "Performance Agent": "performance",
  "Compliance Agent": "compliance",
  "UX Agent": "ux",
  "Reviewer Agent": "reviewer",
  "File Manager Agent": "fileManager",
  "Documenter Agent": "documenter",
  "DevOps Agent": "devOps",
};

// ------------ Chat Service ------------
export const ChatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return apiRequest("/api/chat", {
      method: "POST",
      body: request,
      protected: true,
    });
  },

  async getAvailableAgents() {
    const data = await apiRequest("/api/agents", {});
    // Adapt backend agents to include id and isActive for frontend
    return Array.isArray(data.agents)
      ? data.agents.map((agent: BackendAgent) => ({
          ...agent,
          id: AGENT_NAME_TO_ID[agent.name] || agent.name, // Use mapping or fallback to name
          isActive: false, // Default to not active
        }))
      : [];
  },

  async healthCheck() {
    try {
      await apiRequest("/api/health", {});
      return true;
    } catch {
      return false;
    }
  },

  async sendWorkflowMessage({
    chatId,
    message,
    projectId,
    context,
  }: WorkflowRequest) {
    return apiRequest("/api/chat/workflow", {
      method: "POST",
      body: { chatId, message, projectId, context },
      protected: true,
    });
  },

  async sendMessageStream(payload: {
    chatId: string;
    projectId: string;
    message: string;
    activeAgents: string[];
  }) {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      }/api/chat/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.body) throw new Error("No response body");
    return res.body;
  },
};
