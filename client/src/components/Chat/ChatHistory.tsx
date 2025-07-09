"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useProjectStore } from "@/store/useProjectStore";
import type { ChatSession } from "@/types";
import { Check, Edit2, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatHistory({ isOpen, onClose }: ChatHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const {
    chatSessions,
    activeChatId,
    switchToChatSession,
    deleteChatSession,
    renameChatSession,
    createNewChatSession,
  } = useProjectStore();

  const handleStartEdit = (chat: ChatSession) => {
    setEditingId(chat.id);
    setEditingName(chat.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      renameChatSession(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDeleteChat = (chatId: string) => {
    if (chatSessions.length > 1) {
      deleteChatSession(chatId);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createNewChatSession("New Chat");
      if (newChat?.id) {
        switchToChatSession(newChat.id); // auto switch to new chat
      }
    } catch (err) {
      console.error("Failed to create new chat session:", err);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Chat History</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close chat history"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleNewChat} className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chatSessions.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Spinner size={28} />
            </div>
          ) : (
            <>
              {chatSessions.map((chat: ChatSession) => (
                <div
                  key={chat.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    activeChatId === chat.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    if (editingId !== chat.id) {
                      switchToChatSession(chat.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (editingId !== chat.id) {
                        switchToChatSession(chat.id);
                      }
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />

                    <div className="flex-1 min-w-0">
                      {editingId === chat.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            className="h-6 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Edit chat session name"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit();
                            }}
                            className="h-6 w-6 p-0"
                            aria-label="Save chat name"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="h-6 w-6 p-0"
                            aria-label="Cancel edit"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-sm truncate">
                            {chat.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {chat.messages?.length || 0} messages •{" "}
                            {formatDate(chat.updatedAt)}
                          </div>
                          {(chat.messages?.length || 0) > 0 &&
                            chat.messages && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {chat.messages[chat.messages.length - 1]
                                  ?.content.length > 50
                                  ? chat.messages[
                                      chat.messages.length - 1
                                    ]?.content.slice(0, 50) + "..."
                                  : chat.messages[chat.messages.length - 1]
                                      ?.content}
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {editingId !== chat.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(chat);
                          }}
                          className="h-6 w-6 p-0"
                          aria-label={`Edit chat ${chat.name}`}
                          title="Edit chat"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {chatSessions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            aria-label={`Delete chat ${chat.name}`}
                            title="Delete chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground select-none">
          {chatSessions.length} conversation
          {chatSessions.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
