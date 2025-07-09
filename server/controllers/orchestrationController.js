const { AgentRegistry } = require("../agents/agentRegistry");
const Orchestrator = require("../agents/orchestration/Orchestrator");

const agentRegistry = new AgentRegistry();
const orchestrator = new Orchestrator(agentRegistry);

exports.handleOrchestration = async (req, res) => {
  const { projectGoal } = req.body;
  try {
    await orchestrator.orchestrate(projectGoal);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
