const { Readable } = require("stream");

// ---------------------
// Token Bucket Class
// ---------------------
class TokenBucket {
  constructor(rate = 1, burst = 2) {
    this.rate = rate;
    this.burst = burst;
    this.tokens = burst;
    this.lastRefill = Date.now();
  }

  tryRemoveToken() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  async removeTokenAsync() {
    while (!this.tryRemoveToken()) {
      const waitTime = 1000 / this.rate;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    if (elapsed > 0) {
      this.tokens = Math.min(this.burst, this.tokens + elapsed * this.rate);
      this.lastRefill = now;
    }
  }
}

// ---------------------
// API Client Class
// ---------------------
class APIClient {
  constructor(apiKey, sessionId) {
    this.apiKey = apiKey;
    this.sessionId = sessionId;
    this.baseURL = "https://api.together.xyz/v1/chat/completions";
    this.rateLimiter = new Map(); // agentName -> TokenBucket
  }

  // 🔁 Retry logic with exponential backoff (non-streaming)
  async callWithRetry(agentName, prompt, context, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await this.makeAPICall(agentName, prompt, context);
        const responseTime = Date.now() - startTime;
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = Math.random() * baseDelay;
          await this.delay(jitter);
        }
      }
    }
    throw lastError;
  }

  // 🧠 Normal (non-streaming) API call
  async makeAPICall(agentName, prompt, context) {
    await this._applyRateLimit(agentName);

    const payload = this._buildPayload(agentName, prompt, context, false);

    const response = await fetch(this.baseURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  // ✨ Streaming API call like ChatGPT
  async makeStreamingAPICall(agentName, prompt, context, onToken) {
    await this._applyRateLimit(agentName);

    const payload = this._buildPayload(agentName, prompt, context, true);

    const response = await fetch(this.baseURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(`Streaming API error: ${response.status} ${text}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep partial line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const jsonPart = trimmed.replace(/^data:\s*/, "");
        if (jsonPart === "[DONE]") return;

        try {
          const parsed = JSON.parse(jsonPart);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token && onToken) {
            onToken(token);
          }
        } catch (err) {
          console.error("Streaming parse error:", jsonPart);
        }
      }
    }
  }

  // ---------------------
  // Helpers
  // ---------------------
  async _applyRateLimit(agentName) {
    if (!this.rateLimiter.has(agentName)) {
      this.rateLimiter.set(agentName, new TokenBucket(1, 2));
    }
    const bucket = this.rateLimiter.get(agentName);
    await bucket.removeTokenAsync();
  }

  _buildPayload(agentName, prompt, context, stream = false) {
    let promptContent;
    if (Array.isArray(prompt)) {
      promptContent = prompt.join("\n");
    } else if (typeof prompt === "string") {
      promptContent = prompt;
    } else if (typeof prompt === "object" && prompt !== null) {
      promptContent = prompt.user || JSON.stringify(prompt);
    } else {
      throw new Error("Invalid prompt format");
    }

    return {
      model: agentName,
      messages: [
        { role: "system", content: context?.systemMessage || "" },
        { role: "user", content: promptContent },
      ],
      stream,
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { APIClient };
