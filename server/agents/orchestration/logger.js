const express = require("express");

function emitWorkflowEvent(event, payload) {
  try {
    const io = express().get("io"); // This is a placeholder; in real use, pass io via context or require from server.js
    if (io) io.emit(event, payload);
  } catch (e) {
    // Ignore if io is not available
  }
}

module.exports = {
  info: (...args) => {
    console.log("[INFO]", ...args);
    emitWorkflowEvent("log:info", args);
  },
  debug: (...args) => {
    console.log("[DEBUG]", ...args);
    emitWorkflowEvent("log:debug", args);
  },
  error: (...args) => {
    console.error("[ERROR]", ...args);
    emitWorkflowEvent("log:error", args);
  },
  emitWorkflowEvent,
};
