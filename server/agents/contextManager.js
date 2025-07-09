// contextManager.js - Utility for chatbot context switching (Together AI)

/**
 * Decide if a new message is on the same topic as the previous message.
 * Uses keyword overlap (3+ common words = same topic) or embeddings if enabled.
 * @param {string} newMessage
 * @param {string} prevMessage
 * @param {boolean} [useEmbeddings=false]
 * @returns {'same topic' | 'new topic'}
 */
function decideContextSwitch(newMessage, prevMessage, useEmbeddings = false) {
  if (useEmbeddings) {
    const a = getEmbedding(newMessage);
    const b = getEmbedding(prevMessage);
    const similarity = cosineSimilarity(a, b);
    // Threshold can be tuned; 0.8 is a common default for semantic similarity
    return similarity >= 0.8 ? "same topic" : "new topic";
  }
  // Keyword overlap method
  const tokenize = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  const newWords = new Set(tokenize(newMessage));
  const prevWords = new Set(tokenize(prevMessage));
  let overlap = 0;
  for (const word of newWords) {
    if (prevWords.has(word)) overlap++;
  }
  return overlap >= 3 ? "same topic" : "new topic";
}

/**
 * Stub: Returns a fake embedding (replace with real model later)
 * @param {string} text
 * @returns {number[]}
 */
function getEmbedding(text) {
  // For now, just return a vector of char codes (not meaningful)
  return text.split("").map((c) => c.charCodeAt(0) / 255);
}

/**
 * Stub: Cosine similarity between two vectors
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Helper: Returns true if messages are related (same topic), false otherwise.
 * @param {string} newMessage
 * @param {string} prevMessage
 * @param {boolean} [useEmbeddings=false]
 * @returns {boolean}
 */
function isRelatedMessage(newMessage, prevMessage, useEmbeddings = false) {
  return (
    decideContextSwitch(newMessage, prevMessage, useEmbeddings) === "same topic"
  );
}

module.exports = {
  decideContextSwitch,
  getEmbedding,
  cosineSimilarity,
  isRelatedMessage,
};
