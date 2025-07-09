const {
  runAgents,
  runAgentWorkflow,
  runAgentsStream,
} = require("./agents/runAgents");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.handleChat = async (req, res) => {
  const apiStart = Date.now();
  let timings = {};
  try {
    const { chatId, message, activeAgents, projectId } = req.body;

    // Validate required parameters
    if (
      !chatId ||
      !projectId ||
      !message ||
      !Array.isArray(activeAgents) ||
      !activeAgents.length
    ) {
      console.error("[ERROR] Missing parameters:", {
        chatId,
        projectId,
        message,
        activeAgents,
      });
      return res.status(400).json({
        error:
          "chatId, projectId, message, and at least one activeAgent are required",
      });
    }

    // DEBUG: Check if session exists
    const session = await prisma.chatSession.findUnique({
      where: { id: chatId },
    });
    console.log("DEBUG: chatId", chatId, "session found?", !!session);
    if (!session) {
      return res
        .status(400)
        .json({ error: "Chat session does not exist in DB." });
    }

    // Save user message
    const userMsgStart = Date.now();
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatId,
          role: "user",
          content: message,
        },
      });
      timings.saveUserMessage = Date.now() - userMsgStart;
    } catch (err) {
      console.error("[ERROR] Failed to save user message:", err);
      return res.status(400).json({
        error: "Failed to save user message. Is the chat session valid?",
      });
    }

    let responses = [];
    let files = [];
    const aiStart = Date.now();
    try {
      ({ responses, files } = await runAgents({
        message,
        activeAgents,
        chatId,
      }));
      timings.runAgents = Date.now() - aiStart;
      console.log("DEBUG: runAgents output:", { responses, files });
    } catch (err) {
      console.error("[ERROR] Agent execution failed:", err);
      return res
        .status(500)
        .json({ error: "Agent execution failed: " + (err.message || err) });
    }

    // Defensive check for responses array
    if (!Array.isArray(responses)) {
      console.error(
        "[ERROR] Agent did not return a responses array:",
        responses
      );
      return res
        .status(500)
        .json({ error: "Agent did not return a valid responses array." });
    }

    // Save agent responses
    const saveAgentStart = Date.now();
    try {
      for (const r of responses) {
        let content = "";
        if (typeof r === "string") {
          content = r;
        } else if (
          r &&
          r.choices &&
          Array.isArray(r.choices) &&
          r.choices[0]?.message?.content
        ) {
          content = r.choices[0].message.content;
        } else if (r && typeof r.content === "string") {
          content = r.content;
        }
        await prisma.chatMessage.create({
          data: {
            sessionId: chatId,
            role: "agent",
            content,
          },
        });
      }
      timings.saveAgentResponses = Date.now() - saveAgentStart;
    } catch (err) {
      console.error("[ERROR] Failed to save agent responses:", err);
      return res.status(400).json({
        error: "Failed to save agent responses. Is the chat session valid?",
      });
    }

    // Save files if any
    const saveFilesStart = Date.now();
    try {
      for (const f of files) {
        await prisma.projectFile.create({
          data: {
            projectId,
            filePath: f.filePath,
            content: f.content,
          },
        });
      }
      timings.saveFiles = Date.now() - saveFilesStart;
    } catch (err) {
      console.error("[ERROR] Failed to save files:", err);
      return res
        .status(400)
        .json({ error: "Failed to save files. Is the project valid?" });
    }

    timings.total = Date.now() - apiStart;
    console.log("[PERF] /api/chat timings:", timings);
    res.json({
      success: true,
      messages: responses,
      files,
      timestamp: new Date(),
      timings,
      metadata: {
        chatId,
        projectId,
        activeAgents,
        generatedFiles: files.length,
      },
    });
  } catch (e) {
    console.error("[ERROR] Unhandled error in /api/chat:", e);
    res.status(500).json({ error: e.message || "Internal server error" });
  }
};
exports.handleChatStream = async (req, res) => {
  const { message, chatId, activeAgents, projectId } = req.body;

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  try {
    await runAgentsStream({
      message,
      activeAgents,
      chatId,
      projectId,
      onToken: (token) => {
        res.write(`data: ${token}\n\n`);
      },
    });
    res.write("data: [DONE]\n\n");
  } catch (err) {
    console.error("Streaming error:", err);
    res.write(`data: [ERROR] ${err.message || String(err)}\n\n`);
  }
  res.end();
};
// New: Full agent-to-agent workflow endpoint
exports.handleAgentWorkflow = async (req, res) => {
  try {
    const { chatId, message, projectId, context } = req.body;
    // Define the agent chain for the workflow
    const agentChain = [
      "Coder Agent",
      "Tester Agent",
      "Reviewer Agent",
      "Documenter Agent",
      "DevOps Agent",
    ];
    const { responses } = await runAgentWorkflow({
      message,
      agentChain,
      chatId,
      projectId,
      context,
    });
    res.json({ success: true, responses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
