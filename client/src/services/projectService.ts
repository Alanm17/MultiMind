import { apiRequest } from "../lib/api";

export const ProjectService = {
  async getProject(projectId: string) {
    return apiRequest(`/api/projects/${projectId}`, { protected: true });
  },
  async getProjects() {
    const data = await apiRequest("/api/projects", { protected: true });
    return data.projects;
  },
  async createProject(name: string) {
    const data = await apiRequest("/api/projects", {
      method: "POST",
      body: { name },
      protected: true,
    });
    return data.project;
  },
};
