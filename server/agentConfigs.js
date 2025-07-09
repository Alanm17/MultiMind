const AGENT_CONFIGS = {
  "Coder Agent": {
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", // Together AI model for coding
    systemMessage:
      "You are a senior software engineer. Write clean, efficient, and production-grade code. Handle coding tasks, bug fixes, and implementations accurately.",
  },
  "Tester Agent": {
    model: "mistralai/Mistral-Small-24B-Instruct-2501", // Together AI model for testing
    systemMessage:
      "You are a professional QA engineer. Write comprehensive unit tests, integration tests, and suggest edge cases. Focus on covering code quality thoroughly.",
  },
  "File Manager Agent": {
    model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite", // Together AI model for file management
    systemMessage:
      "You are an intelligent file manager AI. Handle file creation, reading, editing, renaming, and deletion safely. Follow commands precisely, preserving data integrity.",
  },
  "Reviewer Agent": {
    model: "Qwen/Qwen2.5-72B-Instruct-Turbo", // Together AI model for code review
    systemMessage:
      "You are a senior code reviewer. Review code for best practices, performance, security, and correctness. Provide actionable suggestions and detect bugs.",
  },
  "Documenter Agent": {
    model: "google/gemma-2-27b-it", // Together AI model for documentation
    systemMessage:
      "You are a technical writer AI specialized in generating high-quality documentation, docstrings, inline comments, and README files for codebases.",
  },
  "DevOps Agent": {
    model: "meta-llama/Llama-3-70b-chat-hf", // Together AI model for DevOps
    systemMessage:
      "You are an experienced DevOps engineer. Write CI/CD pipelines, Dockerfiles, Kubernetes manifests, deployment scripts, and troubleshoot DevOps tasks effectively.",
  },
};

module.exports = { AGENT_CONFIGS };
