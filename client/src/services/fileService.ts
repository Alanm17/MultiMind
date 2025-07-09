import { apiRequest } from "../lib/api";

export const FileService = {
  async getFiles(projectId: string) {
    return apiRequest(`/api/files/${projectId}/tree`, { protected: true });
  },

  async uploadFile(
    projectId: string,
    file: { filePath: string; content: string }
  ) {
    return apiRequest(`/api/files/${projectId}/file`, {
      method: "POST",
      body: file,
      protected: true,
    });
  },

  async deleteFile(projectId: string, filePath: string) {
    return apiRequest(`/api/files/${projectId}/file`, {
      method: "DELETE",
      body: { path: filePath },
      protected: true,
    });
  },
};
