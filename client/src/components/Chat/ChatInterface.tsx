"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "./MarkdownMessage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ChatService } from "@/services/chatService";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Bot,
  FolderOpen,
  MoreVertical,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

// Types
interface ChatTimings {
  [key: string]: number;
}

interface Agent {
  id: string | number;
  name: string;
  isActive: boolean;
}

interface FileData {
  filePath: string;
  content: string;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  agentName: string;
  timestamp: Date;
  type: "text";
  isStreaming?: boolean;
}

// Constants
const COMMANDS = {
  CLEAR: "/clear",
  RESET: "/reset",
  HELP: "/help",
} as const;

const STREAMING_MESSAGE_ID = "streaming-ai";

// Utility functions
const extractTerminalCommand = (content: string): string | null => {
  const regex = /```terminal\s*\n([\s\S]*?)```/i;
  const match = content.match(regex);
  return match?.[1]?.trim() || null;
};

const generateMessageId = () => Math.random().toString(36).substring(7);

const createMessage = (
  content: string,
  sender: "user" | "ai",
  agentName = "AI",
  isStreaming = false
): Message => ({
  id: generateMessageId(),
  content,
  sender,
  agentName,
  timestamp: new Date(),
  type: "text" as const,
  isStreaming,
});

declare global {
  interface Window {
    injectTerminalCommand?: (command: string) => void;
  }
}

export function ChatInterface() {
  // State
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastTimings, setLastTimings] = useState<ChatTimings | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);

  // Store
  const {
    chatSessions,
    activeChatId,
    isTyping,
    addMessageToActiveChat,
    updateMessageInActiveChat,
    setIsTyping,
    activeAgents,
    availableAgents,
    toggleAgent,
    clearMessages,
    createNewChatSession,
    project,
    openTabs,
    uploadFile,
    openFile,
    loadFiles,
    setActiveArea,
  } = useProjectStore();

  // Computed values
  const activeChat = chatSessions.find((chat) => chat.id === activeChatId);
  const messages = activeChat?.messages || [];
  const filteredMessages = messages.filter(
    (message) => message.content?.trim() !== ""
  );

  const activeAgent =
    availableAgents.find((a) => a.isActive) ||
    availableAgents.find((a) => a.name?.toLowerCase() === "coder") ||
    availableAgents[0];

  const agentLabel = activeAgent?.name || "Coder";
  const truncatedAgentLabel =
    agentLabel.length > 14 ? agentLabel.slice(0, 13) + "…" : agentLabel;

  // Effects

  // Ensure default agent is active
  useEffect(() => {
    if (!Array.isArray(availableAgents) || availableAgents.length === 0) return;

    const coderAgent = availableAgents.find(
      (a) => a.name?.toLowerCase() === "coder"
    );

    if (coderAgent && !coderAgent.isActive) {
      toggleAgent(String(coderAgent.id));
    } else if (!coderAgent) {
      const anyActive = availableAgents.some((a) => a.isActive);
      if (!anyActive) {
        toggleAgent(String(availableAgents[0].id));
      }
    }
  }, [availableAgents, toggleAgent]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping, streamedText]);

  // Handlers
  const handleCommand = useCallback(
    (command: string) => {
      const cmd = command.trim().toLowerCase();

      switch (cmd) {
        case COMMANDS.CLEAR:
          clearMessages();
          toast.success("Chat cleared");
          break;
        case COMMANDS.RESET:
          createNewChatSession("New Chat");
          toast.success("Chat reset");
          break;
        case COMMANDS.HELP:
          toast.info("Commands: /clear, /reset, /help");
          break;
        default:
          toast.error(`Unknown command: ${cmd}`);
      }
    },
    [clearMessages, createNewChatSession]
  );

  const getActiveAgentIds = useCallback(() => {
    return (Array.isArray(activeAgents) ? activeAgents : [])
      .filter((a) => a.isActive)
      .map((a) => a.id);
  }, [activeAgents]);

  const handleFileProcessing = useCallback(
    async (files: FileData[]) => {
      if (!Array.isArray(files)) return;

      for (const file of files) {
        await uploadFile({ filePath: file.filePath, content: file.content });
        openFile({
          id: generateMessageId(),
          name: file.filePath.split("/").pop() || file.filePath,
          path: file.filePath,
          content: file.content,
          language: file.filePath.split(".").pop() || "text",
          type: "file",
        });
      }

      if (project?.id) {
        await loadFiles(project.id);
      }
    },
    [uploadFile, openFile, loadFiles, project?.id]
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    // Handle commands
    if (inputValue.startsWith("/")) {
      handleCommand(inputValue);
      setInputValue("");
      return;
    }

    // Add user message
    addMessageToActiveChat(createMessage(inputValue, "user"));
    const messageToSend = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const data = await ChatService.sendMessage({
        chatId: activeChatId || "default-chat",
        projectId: project?.id || "default-project",
        message: messageToSend,
        activeAgents: getActiveAgentIds(),
      });

      setLastTimings(data.timings || null);

      // Process AI messages
      for (const msg of data.messages) {
        let content = "";

        if (msg?.choices?.[0]?.message?.content) {
          content = msg.choices[0].message.content;
        } else if (typeof msg.content === "string") {
          content = msg.content;
        }

        const agentName =
          msg?.agentName && typeof msg.agentName === "string"
            ? msg.agentName
            : "AI";

        addMessageToActiveChat(createMessage(content, "ai", agentName));
      }

      // Handle file uploads
      await handleFileProcessing(data.files);
      toast.success("Message sent to agent(s)");
    } catch (error) {
      console.error("Chat API error:", error);
      addMessageToActiveChat(
        createMessage(
          "Failed to get AI response. Please try again.",
          "ai",
          "System"
        )
      );
      toast.error("Failed to send message to agent(s)");
    } finally {
      setIsTyping(false);
    }
  }, [
    inputValue,
    handleCommand,
    addMessageToActiveChat,
    activeChatId,
    project?.id,
    getActiveAgentIds,
    handleFileProcessing,
  ]);

  const handleSendMessageStream = useCallback(async () => {
    if (!inputValue.trim()) return;

    // Add user message
    addMessageToActiveChat(createMessage(inputValue, "user"));
    const messageToSend = inputValue;
    setInputValue("");

    // Create streaming message
    const streamingId = generateMessageId();
    setStreamingMessageId(streamingId);
    setIsStreaming(true);
    setStreamedText("");

    // Add initial streaming message
    addMessageToActiveChat(
      createMessage("", "ai", activeAgent?.name || "AI", true)
    );

    const payload = {
      chatId: activeChatId || "default-chat",
      projectId: project?.id || "default-project",
      message: messageToSend,
      activeAgents: getActiveAgentIds(),
    };

    try {
      const stream = await ChatService.sendMessageStream(payload);
      const reader = stream.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (part.startsWith("data: ")) {
              const chunk = part.replace("data: ", "");
              if (chunk === "[DONE]") {
                setIsStreaming(false);
                setStreamingMessageId(null);
                return;
              }

              // Accumulate text and update the streaming message
              accumulatedText += chunk;
              setStreamedText(accumulatedText);

              // Update the last message (streaming message) with new content
              const currentMessages = activeChat?.messages || [];
              const lastMessage = currentMessages[currentMessages.length - 1];
              if (lastMessage && lastMessage.sender === "ai") {
                updateMessageInActiveChat(lastMessage.id, {
                  ...lastMessage,
                  content: accumulatedText,
                  isStreaming: true,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      toast.error("Streaming error: " + (err as Error).message);

      // Add error message
      addMessageToActiveChat(
        createMessage(
          "Failed to stream response. Please try again.",
          "ai",
          "System"
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);

      // Finalize the streaming message
      const currentMessages = activeChat?.messages || [];
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (
        lastMessage &&
        lastMessage.sender === "ai" &&
        lastMessage.isStreaming
      ) {
        updateMessageInActiveChat(lastMessage.id, {
          ...lastMessage,
          isStreaming: false,
        });
      }
    }
  }, [
    inputValue,
    addMessageToActiveChat,
    updateMessageInActiveChat,
    activeChatId,
    project?.id,
    getActiveAgentIds,
    activeAgent?.name,
    activeChat?.messages,
  ]);

  const handleWorkflow = useCallback(async () => {
    if (!inputValue.trim()) return;

    addMessageToActiveChat(createMessage(inputValue, "user"));
    const messageToSend = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const context = openTabs.map((tab) => ({
        path: tab.path,
        content: tab.content,
        language: tab.language,
      }));

      const data = await ChatService.sendWorkflowMessage({
        chatId: activeChatId || "default-chat",
        message: messageToSend,
        projectId: project?.id || "default-project",
        context,
      });

      if (Array.isArray(data.responses)) {
        for (const resp of data.responses) {
          addMessageToActiveChat(
            createMessage(resp.content, "ai", resp.agentName)
          );

          // Handle terminal commands
          const terminalCommand = extractTerminalCommand(resp.content);
          if (terminalCommand) {
            setActiveArea("terminal");
            window.injectTerminalCommand?.(terminalCommand);
          }

          // Set active area based on agent
          const agentName = resp.agentName?.toLowerCase();
          if (agentName?.includes("coder")) setActiveArea("editor");
          if (agentName?.includes("file")) setActiveArea("files");
          if (agentName?.includes("preview")) setActiveArea("preview");
        }
      } else {
        console.error("Invalid response from workflow API:", data);
        toast.error("Agent workflow response is invalid.");
      }

      await handleFileProcessing(data.files);
      toast.success("Workflow sent to agent(s)");
    } catch (error) {
      console.error("Workflow error:", error);
      addMessageToActiveChat(
        createMessage("Workflow failed. Please try again.", "ai", "System")
      );
      toast.error("Failed to send workflow to agent(s)");
    } finally {
      setIsTyping(false);
    }
  }, [
    inputValue,
    addMessageToActiveChat,
    openTabs,
    activeChatId,
    project?.id,
    setActiveArea,
    handleFileProcessing,
  ]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (streaming) {
          await handleSendMessageStream();
        } else {
          await handleSendMessage();
        }
      }
    },
    [streaming, handleSendMessageStream, handleSendMessage]
  );

  const handleNewChat = useCallback(() => {
    createNewChatSession("New Chat");
  }, [createNewChatSession]);

  const handleClearChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const toggleStreaming = useCallback(() => {
    setStreaming((prev) => !prev);
  }, []);

  // Render helpers
  const renderActiveAgents = () =>
    (activeAgents ?? [])
      .filter((agent) => agent.isActive)
      .map((agent) => (
        <Badge
          key={String(agent.id)}
          variant="secondary"
          className="text-xs flex items-center gap-1"
        >
          <Bot className="w-3 h-3" />
          {agent.name}
        </Badge>
      ));

  const renderAgentDropdown = () => {
    if (!availableAgents?.length) {
      return <span className="text-red-500 text-xs">No agents available</span>;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-full px-4 py-2 bg-user-bg hover:bg-user-bg text-user-text border border-user-text shadow-sm transition flex items-center gap-2">
            <Bot className="w-4 h-4" />
            {truncatedAgentLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {availableAgents.map((agent) => (
            <DropdownMenuItem
              key={String(agent.id)}
              onClick={() => toggleAgent(String(agent.id))}
              className={`flex items-center gap-2 ${
                agent.isActive ? "bg-user-bg text-user-text" : ""
              }`}
            >
              <Bot className="w-4 h-4 text-user-text" />
              <span className="truncate max-w-[200px]">
                {agent.name || "Unnamed"}
              </span>
              {agent.isActive && (
                <span className="ml-auto text-xs font-semibold text-user-text">
                  Active
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderMessages = () => {
    if (!activeChat && !isTyping) {
      return (
        <div className="flex items-center justify-center h-32">
          <Spinner size={28} />
        </div>
      );
    }

    return (
      <div className="space-y-6 w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-6">
        {filteredMessages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={message.isStreaming || false}
          />
        ))}

        {isTyping && !isStreaming && (
          <TypingIndicator agentName={activeAgent?.name || "AI Agent"} />
        )}

        {lastTimings && (
          <div className="mt-2 text-xs text-muted-foreground bg-gray-900/80 rounded p-3 max-w-md mx-auto border border-gray-700">
            <div className="font-semibold mb-1">⏱️ Response Timings (ms):</div>
            <ul className="space-y-0.5">
              {Object.entries(lastTimings).map(([k, v]) => (
                <li key={k}>
                  <span className="font-mono text-gray-300">{k}</span>:{" "}
                  <span className="font-mono text-gray-100">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-user-bg text-user-text">
      {/* Header */}
      <div className="px-2 sm:px-4 md:px-6 py-4 border-b bg-user-bg shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Chat history toggled")}
            className="flex items-center gap-2"
          >
            <FolderOpen className="w-5 h-5" />
            History
          </Button>
          <h2 className="text-xl font-semibold text-user-text truncate max-w-xs">
            {activeChat?.name || "AI Assistant"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {renderActiveAgents()}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleNewChat}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleClearChat}
                className="text-red-500 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <span className="text-sm text-user-text opacity-60 font-medium">
          Agent:
        </span>
        {renderAgentDropdown()}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-2 sm:px-4 md:px-6 py-4 overflow-y-auto w-full max-w-full">
        {renderMessages()}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-user-bg px-2 sm:px-4 md:px-6 py-4 shadow-inner w-full max-w-full">
        <div className="flex items-end gap-4">
          <Textarea
            rows={2}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none bg-code-bg rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-user-text shadow-sm placeholder:text-muted-foreground text-black"
            spellCheck={false}
          />
          <Button
            size="icon"
            className="text-user-text rounded-full shadow-md hover:bg-user-bg transition"
            onClick={streaming ? handleSendMessageStream : handleSendMessage}
            disabled={isTyping || isStreaming}
            aria-label="Send Message"
          >
            <Send className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            className="bg-code-bg text-code-text px-5 py-2 rounded-md shadow hover:bg-code-bg"
            onClick={handleWorkflow}
            disabled={isTyping || isStreaming}
          >
            Run Workflow
          </Button>
          <Button
            variant={streaming ? "default" : "outline"}
            size="sm"
            className="ml-2 text-sm px-3 py-1.5 rounded bg-code-bg text-code-text border border-user-text"
            onClick={toggleStreaming}
            aria-label="Toggle Streaming Mode"
          >
            {streaming ? "Streaming" : "Standard"}
          </Button>
        </div>
      </div>
    </div>
  );
}
