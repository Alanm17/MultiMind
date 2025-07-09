const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function sanitizeSummary(summary) {
  // Basic sanitization: remove script tags and trim
  return summary.replace(/<script.*?>.*?<\/script>/gi, "").trim();
}

exports.getMemory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const memory = await prisma.memorySummary.findFirst({
      where: { sessionId },
      orderBy: { lastUpdated: "desc" },
    });

    res.json(memory || { summary: "" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateMemory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    let { summary } = req.body;
    if (!summary) return res.status(400).json({ error: "summary required" });
    summary = sanitizeSummary(summary);

    const memory = await prisma.memorySummary.upsert({
      where: { sessionId },
      update: { summary },
      create: { sessionId, summary },
    });

    res.json(memory);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
