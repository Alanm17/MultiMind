import { ChatService, getActiveAgentNames } from "@/services/chatService";
import { FileService } from "@/services/fileService";
import { HistoryService } from "@/services/historyService";
import { MemoryService } from "@/services/memoryService";
import { ProjectService } from "@/services/projectService";
import type {
  Agent,
  ChatMessage,
  ChatSession,
  FileNode,
  ProjectState,
  RightPanelMode,
  Tab,
  TerminalLog,
} from "@/types";
import { toast } from "sonner";
import { create } from "zustand";

// Helper functions
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    tsx: "typescript",
    ts: "typescript",
    jsx: "javascript",
    js: "javascript",
    json: "json",
    css: "css",
    html: "html",
    yml: "yaml",
    md: "markdown",
    sh: "bash",
  };
  return map[ext || ""] || "text";
}

function convertFilesToFileTree(files: FileNode[]): FileNode[] {
  const tree: FileNode[] = [];
  const pathMap = new Map<string, FileNode>();
  for (const file of files) {
    const parts = file.path.split("/");
    let current = tree;
    let fullPath = "";

    parts.forEach((part, index) => {
      fullPath = fullPath ? `${fullPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      const existing = current.find((f) => f.name === part);
      if (existing) {
        if (isFile) {
          // Overwrite file node if duplicate path
          if (pathMap.has(fullPath)) {
            console.warn(
              `Duplicate file path detected: ${fullPath}. Overwriting previous node.`
            );
            Object.assign(existing, {
              id: file.id || existing.id,
              name: part,
              type: "file",
              path: fullPath,
              language: getLanguageFromPath(part),
              content: file.content,
            });
          }
        } else if (existing.children) {
          current = existing.children;
        }
      } else {
        const newNode: FileNode = {
          id: file.id || Math.random().toString(36).substring(7),
          name: part,
          type: isFile ? "file" : "folder",
          path: fullPath,
          language: isFile ? getLanguageFromPath(part) : undefined,
          content: isFile ? file.content : undefined,
          isOpen: false,
          children: isFile ? undefined : [],
        };
        current.push(newNode);
        if (isFile) {
          pathMap.set(fullPath, newNode);
        } else if (newNode.children) {
          current = newNode.children;
        }
      }
    });
  }
  return tree;
}

// Define the ProjectStore type for Zustand
export interface ProjectStore {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  memorySummary: unknown; // TODO: Replace 'unknown' with a specific type if available
  project: ProjectState | null;
  fileTree: FileNode[];
  openTabs: Tab[];
  activeTabId: string | null;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  availableAgents: Agent[];
  activeAgents: Agent[];
  isChatHistoryOpen: boolean;
  terminalLogs: TerminalLog[];
  isTerminalVisible: boolean;
  rightPanelMode: RightPanelMode;
  isFileTreeCollapsed: boolean;
  theme: string;
  activeArea: string | null;
  loadProject: (projectId: string) => Promise<void>;
  loadFiles: (projectId: string) => Promise<void>;
  uploadFile: (file: { filePath: string; content: string }) => Promise<unknown>; // TODO: Replace 'unknown' with a specific type if available
  deleteFile: (fileId: number) => Promise<void>;
  openFile: (file: FileNode) => void;
  closeTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  loadChatSessions: (projectId: string) => Promise<void>;
  loadMessagesForSession: (sessionId: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  createNewChatSession: (name: string) => Promise<void>;
  deleteChatSession: (sessionId: string) => Promise<void>;
  renameChatSession: (sessionId: string, name: string) => Promise<void>;
  loadMemory: (sessionId: string) => Promise<void>;
  updateMemory: (sessionId: string, summary: string) => Promise<void>;
  toggleAgent: (agentId: string) => void;
  addTerminalLog: (log: Omit<TerminalLog, "id" | "timestamp">) => void;
  toggleChatHistory: () => void;
  switchToChatSession: (sessionId: string) => void;
  addMessageToActiveChat: (message: ChatMessage) => void;
  setIsTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
  deleteMessageFromActiveChat: (messageId: string) => void;
  setActiveArea: (area: string | null) => void;
  setActiveTab: (tabId: string) => void;
  toggleTheme: () => void;
  toggleFileTree: () => void;
  setRightPanelMode: (mode: RightPanelMode) => void;
  clearTerminalLogs: () => void;
  fetchProjects: () => Promise<ProjectState[]>;
  createNewProject: (name: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // 🔥 State
  chatSessions: [],
  activeChatId: null,
  memorySummary: null,

  project: null,
  fileTree: [],
  openTabs: [],
  activeTabId: null,

  isLoading: false,
  error: null,
  isTyping: false,

  availableAgents: [],
  activeAgents: [],
  isChatHistoryOpen: false,

  terminalLogs: [],
  isTerminalVisible: false,

  rightPanelMode: "app",
  isFileTreeCollapsed: false,
  theme: "light",

  activeArea: null, // "terminal" | "editor" | "files" | "preview" | null

  // 🔥 Project Actions
  loadProject: async (projectId: string) => {
    try {
      const project = await ProjectService.getProject(projectId);
      const agents = await ChatService.getAvailableAgents();
      set({ project, activeAgents: agents, availableAgents: agents });
    } catch (err) {
      console.error(err);
      set({ error: "Failed to load project" });
    }
  },

  // 🔥 File Actions
  loadFiles: async (projectId: string) => {
    const files = await FileService.getFiles(projectId);
    const tree = convertFilesToFileTree(files);
    set({ fileTree: tree });
  },

  uploadFile: async (file: { filePath: string; content: string }) => {
    const projectId = get().project?.id;
    if (!projectId) return;
    try {
      const savedFile = await FileService.uploadFile(projectId, file);
      await get().loadFiles(projectId);
      toast.success(`File uploaded: ${file.filePath}`);
      return savedFile;
    } catch (err) {
      toast.error(`Failed to upload file: ${file.filePath}`);
      throw err;
    }
  },

  deleteFile: async (fileId: number) => {
    try {
      const projectId = get().project?.id;
      if (!projectId) throw new Error("No project selected");
      await FileService.deleteFile(projectId, String(fileId));
      await get().loadFiles(projectId);
      toast.success("File deleted");
    } catch (err) {
      toast.error("Failed to delete file");
      throw err;
    }
  },

  openFile: (file: FileNode) => {
    const existing = get().openTabs.find((t: Tab) => t.path === file.path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const newTab: Tab = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      path: file.path,
      content: file.content ?? "",
      language: file.language || "text",
    };
    set({
      openTabs: [...get().openTabs, newTab],
      activeTabId: newTab.id,
    });
  },

  closeTab: (tabId: string) => {
    const remaining = get().openTabs.filter((tab: Tab) => tab.id !== tabId);
    set({
      openTabs: remaining,
      activeTabId: remaining.length ? remaining[0].id : null,
    });
  },

  updateTabContent: (tabId: string, content: string) => {
    set({
      openTabs: get().openTabs.map((t: Tab) =>
        t.id === tabId ? { ...t, content } : t
      ),
    });
  },

  // 🔥 Chat Actions
  loadChatSessions: async (projectId: string) => {
    const sessions = await HistoryService.getSessions(projectId);
    set({ chatSessions: sessions, activeChatId: sessions[0]?.id || null });
  },

  loadMessagesForSession: async (sessionId: string) => {
    const messages = await HistoryService.getMessages(sessionId);
    set({
      chatSessions: get().chatSessions.map((s: ChatSession) =>
        s.id === sessionId ? { ...s, messages } : s
      ),
    });
  },
  updateMessageInActiveChat: (
    messageId: string,
    updatedMessage: ChatMessage
  ) => {
    // Update the specific message in the active chat
    set((state) => ({
      chatSessions: state.chatSessions.map((session) =>
        session.id === state.activeChatId
          ? {
              ...session,
              messages: (session.messages ?? []).map((msg) =>
                msg.id === messageId ? updatedMessage : msg
              ),
            }
          : session
      ),
    }));
  },
  sendChatMessage: async (message: string) => {
    const state = get();
    if (!state.activeChatId) {
      set({ error: "No active chat session" });
      return;
    }
    const projectId = state.project?.id;
    if (!projectId) {
      set({ error: "No active project" });
      return;
    }
    const chatId = state.activeChatId;
    const activeAgents = getActiveAgentNames(state.activeAgents);

    set({ isTyping: true });

    try {
      const response = await ChatService.sendMessage({
        chatId,
        message,
        activeAgents,
        projectId,
      });

      // Save user message
      await HistoryService.addMessage(chatId, {
        sender: "user",
        content: message,
      });

      // Save AI messages
      for (const m of response.messages) {
        await HistoryService.addMessage(chatId, {
          sender: "ai",
          content: m.content,
          agentName: m.agentName,
        });
      }

      // Update frontend
      await get().loadMessagesForSession(chatId);
      await get().loadFiles(projectId);
      await get().loadMemory(chatId);
    } catch (err) {
      console.error(err);
      set({ error: "Failed to send chat message" });
    } finally {
      set({ isTyping: false });
    }
  },

  createNewChatSession: async (name: string) => {
    const project = get().project;
    if (!project || !project.id) {
      set({ error: "No active project" });
      toast.error("No active project loaded");
      return;
    }
    try {
      const session = await HistoryService.createSession({
        projectId: project.id,
        name,
      });
      await get().loadChatSessions(project.id);
      set({ activeChatId: session.id });
      toast.success("Chat session created");
    } catch (err) {
      toast.error("Failed to create chat session");
      throw err;
    }
  },

  deleteChatSession: async (sessionId: string) => {
    try {
      await HistoryService.deleteSession(sessionId);
      const project = get().project;
      if (project) {
        await get().loadChatSessions(project.id);
      }
      toast.success("Chat session deleted");
    } catch (err) {
      toast.error("Failed to delete chat session");
      throw err;
    }
  },

  renameChatSession: async (sessionId: string, name: string) => {
    try {
      await HistoryService.renameSession(sessionId, name);
      const project = get().project;
      if (project) {
        await get().loadChatSessions(project.id);
      }
      toast.success("Chat session renamed");
    } catch (err) {
      toast.error("Failed to rename chat session");
      throw err;
    }
  },

  // 🔥 Memory Actions
  loadMemory: async (sessionId: string) => {
    const memory = await MemoryService.getMemory(sessionId);
    set({ memorySummary: memory });
  },

  updateMemory: async (sessionId: string, summary: string) => {
    try {
      const updated = await MemoryService.updateMemory(sessionId, summary);
      set({ memorySummary: updated });
      toast.success("Memory summary updated");
    } catch (err) {
      toast.error("Failed to update memory summary");
      throw err;
    }
  },

  // 🔥 Agent Actions
  toggleAgent: (agentId: string) => {
    const updated = get().activeAgents.map((agent: Agent) =>
      agent.id === agentId
        ? { ...agent, isActive: true }
        : { ...agent, isActive: false }
    );
    set({ activeAgents: updated });
    const toggledAgent = updated.find((agent: Agent) => agent.id === agentId);
    if (toggledAgent) {
      toast.success(`${toggledAgent.name} selected`);
    }
  },

  // 🔥 Terminal Actions
  addTerminalLog: (log: Omit<TerminalLog, "id" | "timestamp">) => {
    const entry = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    set({ terminalLogs: [...get().terminalLogs, entry] });
  },

  toggleTerminal: () => {
    set({ isTerminalVisible: !get().isTerminalVisible });
  },

  // 🔥 UI Actions
  toggleChatHistory: () => {
    set((state) => ({ isChatHistoryOpen: !state.isChatHistoryOpen }));
  },

  setRightPanelMode: (mode: RightPanelMode) => {
    set({ rightPanelMode: mode });
  },

  toggleFileTree: () => {
    set((state) => ({ isFileTreeCollapsed: !state.isFileTreeCollapsed }));
  },

  toggleTheme: () => {
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" }));
  },

  setTheme: (theme: "light" | "dark") => {
    set({ theme });
  },

  clearError: () => set({ error: null }),

  setActiveArea: (area: string | null) => {
    set({ activeArea: area });
  },

  // Add stubs for missing actions/properties
  switchToChatSession: (sessionId: string) => {
    set({ activeChatId: sessionId });
  },

  addMessageToActiveChat: (message: ChatMessage) => {
    const state = get();
    if (!state.activeChatId) return;

    set({
      chatSessions: state.chatSessions.map((session) =>
        session.id === state.activeChatId
          ? {
              ...session,
              messages: [...(session.messages || []), message],
            }
          : session
      ),
    });
  },

  setIsTyping: (isTyping: boolean) => {
    set({ isTyping });
  },

  clearMessages: () => {
    const state = get();
    if (!state.activeChatId) return;

    set({
      chatSessions: state.chatSessions.map((session) =>
        session.id === state.activeChatId
          ? {
              ...session,
              messages: [],
            }
          : session
      ),
    });
  },

  deleteMessageFromActiveChat: (messageId: string) => {
    const state = get();
    if (!state.activeChatId) return;

    set({
      chatSessions: state.chatSessions.map((session) =>
        session.id === state.activeChatId
          ? {
              ...session,
              messages: (session.messages || []).filter(
                (msg) => msg.id !== messageId
              ),
            }
          : session
      ),
    });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  clearTerminalLogs: () => {
    set({ terminalLogs: [] });
  },

  fetchProjects: async (): Promise<ProjectState[]> => {
    // TODO: Implement getProjects in ProjectService
    return await ProjectService.getProjects();
  },

  // Manual project creation action
  createNewProject: async (name: string) => {
    try {
      const project = await ProjectService.createProject(name);
      set({ project });
      toast.success("New project created");
      await get().loadChatSessions(project.id);
      await get().loadFiles(project.id);
    } catch (err) {
      set({ error: "Failed to create project" });
      toast.error("Failed to create project");
    }
  },
}));
