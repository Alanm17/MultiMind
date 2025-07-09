// services/chatService.ts
import type {
  Agent,
  ChatRequest,
  ChatResponse,
  WorkflowRequest,
} from "../../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiError {
  error: string;
  message?: string;
}

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getAvailableAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_BASE_URL}/api/agents`);
  if (!res.ok) throw await res.json();
  const data = await res.json();
  // Transform backend response to match frontend Agent type
  return data.agents.map(
    (agent: {
      id: string;
      name: string;
      isActive: boolean;
      role: string;
      avatar?: string;
    }) => ({
      id: agent.id,
      name: agent.name,
      isActive: agent.isActive,
      role: agent.role,
      avatar: agent.avatar,
    })
  );
}

export async function healthCheck(): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return res.ok;
}

export async function sendWorkflowMessage({
  chatId,
  message,
  projectId,
  context,
}: WorkflowRequest) {
  const res = await fetch(`${API_BASE_URL}/api/chat/workflow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message, projectId, context }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// Helper function to convert frontend agents to backend format
export function getActiveAgentNames(agents: Agent[]): string[] {
  return agents.filter((agent) => agent.isActive).map((agent) => agent.name);
}
