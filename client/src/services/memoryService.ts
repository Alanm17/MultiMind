import { apiRequest } from "../lib/api";

export const MemoryService = {
  async getMemory(chatId: string) {
    return apiRequest(`/api/memory/${chatId}`, { protected: true });
  },

  async updateMemory(chatId: string, summary: string) {
    return apiRequest(`/api/memory/${chatId}`, {
      method: "POST",
      body: { summary },
      protected: true,
    });
  },
};
