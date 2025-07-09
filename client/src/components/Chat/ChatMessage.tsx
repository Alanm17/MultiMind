"use client";

import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/useProjectStore";
import type { ChatMessage as ChatMessageType } from "@/types";
import { format } from "date-fns";
import { Bot, Check, Copy, Trash2, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownMessage } from "./MarkdownMessage";

interface ChatMessageProps {
  message: ChatMessageType;
  onDelete?: (messageId: string) => void;
  isStreaming?: boolean; // New prop
}

export function ChatMessage({
  message,
  onDelete,
  isStreaming = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const store = useProjectStore();

  const isUser = message.sender === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) onDelete(message.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-3 px-2 ${isUser ? "flex-row-reverse" : ""}`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center `}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message bubble */}
        <div
          className={`flex-1 max-w-[80%] flex flex-col ${
            isUser ? "items-end" : "items-start"
          }`}
        >
          {/* Sender + time */}
          <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
            <span className="font-bold">
              {isUser ? "You" : message.agentName || "AI"}
            </span>
            <span>{format(new Date(message.timestamp), "HH:mm")}</span>
          </div>

          {/* Message content */}
          <div className={`group relative w-full rounded-xl p-4 shadow-md`}>
            <MarkdownMessage
              content={message.content}
              isAI={!isUser}
              animated={isStreaming}
            />

            {/* Controls */}
            {isUser ? (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopy}
                  title="Copy entire message"
                >
                  {copied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
