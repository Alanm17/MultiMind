const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const projectService = require("../services/projectService");

const DEFAULT_MAX_MESSAGES = 100;
const DEFAULT_MAX_TOKENS = 3000;

exports.getSessions = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId)
      return res.status(400).json({ error: "projectId required" });

    const sessions = await prisma.chatSession.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
    });

    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { projectId, name, maxMessages, maxTokens } = req.body;
    if (!projectId || !name || !name.trim())
      return res
        .status(400)
        .json({ error: "projectId and non-empty name required" });

    // FIX: Only look up the project, do not upsert or create
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const session = await prisma.chatSession.create({
      data: {
        projectId: project.id,
        name,
        maxMessages: maxMessages ?? DEFAULT_MAX_MESSAGES,
        maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
      },
    });

    // Load prior sessions' MemorySummary and ProjectMemory for context
    const priorSessions = await prisma.chatSession.findMany({
      where: { projectId, id: { not: session.id } },
      orderBy: { createdAt: "asc" },
      include: { memorySummaries: true },
    });
    const allSummaries = priorSessions.flatMap((s) =>
      s.memorySummaries.map((m) => m.summary)
    );
    const projectMemoryRows = await prisma.projectMemory.findMany({
      where: { projectId },
    });
    const projectMemory = Object.fromEntries(
      projectMemoryRows.map(({ key, value }) => [key, value])
    );

    res
      .status(201)
      .json({ session, priorMemorySummaries: allSummaries, projectMemory });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await prisma.chatMessage.deleteMany({ where: { sessionId } });
    await prisma.chatSession.delete({ where: { id: sessionId } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.renameSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });

    const session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { name },
    });

    res.json(session);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sender, content, agentName } = req.body;
    if (!sender || !content)
      return res.status(400).json({ error: "sender and content required" });
    if (!["user", "agent"].includes(sender))
      return res.status(400).json({ error: "Invalid sender role" });

    // Enforce per-session message limit
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    const maxMessages = session.maxMessages ?? DEFAULT_MAX_MESSAGES;
    const messageCount = await prisma.chatMessage.count({
      where: { sessionId },
    });
    if (messageCount >= maxMessages) {
      return res.status(400).json({
        error: `This chat has reached the maximum of ${maxMessages} messages. Please start a new chat to continue.`,
        limitReached: true,
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: sender,
        content: agentName ? `${agentName}: ${content}` : content,
      },
    });

    res.status(201).json(message);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
