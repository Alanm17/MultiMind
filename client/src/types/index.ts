export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai" | "system";
  agentName?: string;
  timestamp: Date;
  type?: "text" | "code" | "file" | "error" | "files";
  files?: Array<{ filePath: string; content: string; agent: string }>; // Added files property
}

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface Tab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

export interface ProjectState {
  id: string;
  userId: string;
  name: string;
  createdAt: string; // ISO date string from backend
  // Optional fields that might be added later
  description?: string;
  framework?: string;
  status?: "idle" | "generating" | "building" | "error";
}

export interface TerminalLog {
  id: string;
  content: string;
  type: "info" | "error" | "success" | "command";
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  name: string;
  messages?: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface ChatRequest {
  message: string;
  chatId: string;
  projectId: string;
  context?: unknown; // TODO: Replace 'unknown' with a specific type if available
}

export interface ChatResponse {
  messages: Array<{ content: string; agentName: string }>;
  responses: Array<{ agentName: string; content: string }>;
  files?: Array<{ filePath: string; content: string; agent: string }>;
  timings?: Record<string, number>;
  metadata?: {
    chatId: string;
    projectId: string;
    generatedFiles: number;
  };
}

export interface WorkflowRequest {
  chatId: string;
  message: string;
  projectId: string;
  context?: unknown; // TODO: Replace 'unknown' with a specific type if available
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  isActive: boolean;
}

export type RightPanelMode = "app" | "coder" | "terminal";

export interface ProjectFile {
  id: number;
  projectId: number;
  filePath: string;
  content: string;
}
