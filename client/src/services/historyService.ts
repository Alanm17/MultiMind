import { apiRequest } from "../lib/api";

export const HistoryService = {
  async getSessions(projectId: string) {
    return apiRequest(`/api/sessions?projectId=${projectId}`, {
      protected: true,
    });
  },

  async getMessages(chatId: string) {
    return apiRequest(`/api/sessions/${chatId}/messages`, { protected: true });
  },

  async createSession(data: { projectId: string; name: string }) {
    return apiRequest("/api/sessions", {
      method: "POST",
      body: data,
      protected: true,
    });
  },

  async deleteSession(sessionId: string) {
    return apiRequest(`/api/sessions/${sessionId}`, {
      method: "DELETE",
      protected: true,
    });
  },

  async renameSession(sessionId: string, name: string) {
    return apiRequest(`/api/sessions/${sessionId}/rename`, {
      method: "POST",
      body: { name },
      protected: true,
    });
  },

  async addMessage(
    sessionId: string,
    message: { sender: string; content: string; agentName?: string }
  ) {
    return apiRequest(`/api/sessions/${sessionId}/messages`, {
      method: "POST",
      body: message,
      protected: true,
    });
  },
};
