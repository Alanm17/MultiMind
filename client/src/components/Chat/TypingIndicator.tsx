"use client";

import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  agentName: string;
}

export function TypingIndicator({ agentName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3">
      {/* Agent Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-md">
        <Bot className="w-5 h-5" />
      </div>

      {/* Typing Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="outline"
            className="text-xs font-semibold text-primary"
          >
            {agentName}
          </Badge>
          <span className="text-xs text-muted-foreground italic select-none">
            is typing...
          </span>
        </div>

        <div className="bg-muted rounded-lg px-5 py-3 mr-8 shadow-sm border border-muted-border">
          <div className="flex items-center gap-1">
            <div className="flex space-x-1">
              <span
                className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
