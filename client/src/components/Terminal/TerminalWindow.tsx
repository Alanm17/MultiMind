"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectStore } from "@/store/useProjectStore";
import { Download, Settings, Terminal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TerminalWindow() {
  const [input, setInput] = useState("");
  const {
    terminalLogs,
    addTerminalLog,
    clearTerminalLogs,
    activeArea,
    setActiveArea,
  } = useProjectStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  // Expose a function to programmatically add a command and set terminal as active
  useEffect(() => {
    window.injectTerminalCommand = (command) => {
      setActiveArea("terminal");
      addTerminalLog({ content: `$ ${command}`, type: "command" });
    };
    return () => {
      window.injectTerminalCommand = undefined;
    };
  }, [addTerminalLog, setActiveArea]);

  const handleCommand = (command: string) => {
    if (!command.trim()) return;

    // Add command to logs
    addTerminalLog({
      content: `$ ${command}`,
      type: "command",
    });

    // Simulate command execution
    setTimeout(() => {
      switch (command.toLowerCase()) {
        case "help":
          addTerminalLog({
            content:
              "Available commands: help, clear, ls, npm install, npm run dev, npm run build",
            type: "info",
          });
          break;
        case "clear":
          clearTerminalLogs();
          break;
        case "ls":
          addTerminalLog({
            content:
              "src/\ncomponents/\npackage.json\nREADME.md\nnext.config.js",
            type: "info",
          });
          break;
        case "npm install":
          addTerminalLog({
            content: "Installing dependencies...",
            type: "info",
          });
          setTimeout(() => {
            addTerminalLog({
              content: "✓ Dependencies installed successfully",
              type: "success",
            });
          }, 1500);
          break;
        case "npm run dev":
          addTerminalLog({
            content: "Starting development server...",
            type: "info",
          });
          setTimeout(() => {
            addTerminalLog({
              content: "✓ Development server started on http://localhost:3000",
              type: "success",
            });
          }, 1000);
          break;
        case "npm run build":
          addTerminalLog({
            content: "Building application...",
            type: "info",
          });
          setTimeout(() => {
            addTerminalLog({
              content: "✓ Build completed successfully",
              type: "success",
            });
          }, 2000);
          break;
        default:
          addTerminalLog({
            content: `Command not found: ${command}. Type 'help' for available commands.`,
            type: "error",
          });
      }
    }, 300);

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(input);
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "success":
        return "text-green-500";
      case "command":
        return "text-blue-500 font-medium";
      default:
        return "text-foreground";
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case "error":
        return "❌";
      case "success":
        return "✅";
      case "command":
        return ">";
      default:
        return "ℹ️";
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-user-bg text-user-text font-mono border-2 transition-all ${
        activeArea === "terminal"
          ? "border-blue-500 shadow-lg"
          : "border-transparent"
      }`}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-user-bg">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium text-user-text">Terminal</span>
          <Badge variant="secondary" className="text-xs">
            Ready
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminalLogs}
            className="h-8 w-8 p-0 text-gray-400 hover:text-user-text"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-user-text"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-user-text"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 min-h-0 p-4">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-1">
            {/* Welcome Message */}
            {terminalLogs.length === 0 && (
              <div className="text-gray-500 text-sm mb-4">
                <p>Welcome to the Same.dev Terminal!</p>
                <p>Type 'help' to see available commands.</p>
              </div>
            )}

            {/* Terminal Logs */}
            {terminalLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 text-xs mt-0.5">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className="text-xs mt-0.5">
                  {getLogTypeIcon(log.type)}
                </span>
                <pre
                  className={`whitespace-pre-wrap break-words ${getLogTypeColor(
                    log.type
                  )}`}
                >
                  {log.content}
                </pre>
              </div>
            ))}

            {/* Input Line */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-blue-400">$</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-user-text font-mono"
                placeholder="Enter command..."
                autoFocus
              />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Terminal Footer */}
      <div className="px-4 py-2 border-t border-gray-800 bg-user-bg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Ready for commands</span>
          <span>Press Enter to execute</span>
        </div>
      </div>
    </div>
  );
}
