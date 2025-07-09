const TogetherAI = require("together-ai");
const express = require("express");
const router = express.Router();

const together = new TogetherAI({ apiKey: process.env.TOGETHER_API_KEY });

// POST /api/chat/stream
router.post("/api/chat/stream", async (req, res) => {
  try {
    const { messages, model } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await together.chat.completions.create({
      model: model || "togethercomputer/llama-2-70b-chat",
      messages,
      stream: true,
    });

    stream.on("data", (chunk) => {
      res.write(`data: ${chunk.choices[0]?.delta?.content || ""}\n\n`);
    });

    stream.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });

    stream.on("error", (err) => {
      console.error("[TogetherAI stream error]", err);
      res.write(`data: [ERROR] ${err.message}\n\n`);
      res.end();
    });

    req.on("close", () => {
      stream.destroy();
      res.end();
    });
  } catch (err) {
    console.error("[AI stream error]", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
