class CRUDPromptBuilder {
  buildCRUDPrompt(agentName, context, appType) {
    // Implement CRUD prompt building logic
    let prompt = `Agent: ${agentName}\nApp Type: ${appType || ""}\n`;
    // ... add more prompt logic as needed ...
    if (context.projectMemory) {
      prompt += `\n\nPreviously remembered project data:\n`;
      for (const [key, value] of Object.entries(context.projectMemory)) {
        prompt += `- ${key}: ${value}\n`;
      }
    }
    return prompt;
  }

  buildStandardPrompt(agentName, context) {
    // Implement standard prompt building logic
    let prompt = `Agent: ${agentName}\n`;
    // ... add more prompt logic as needed ...
    if (context.projectMemory) {
      prompt += `\n\nPreviously remembered project data:\n`;
      for (const [key, value] of Object.entries(context.projectMemory)) {
        prompt += `- ${key}: ${value}\n`;
      }
    }
    return prompt;
  }
}

module.exports = { CRUDPromptBuilder };
