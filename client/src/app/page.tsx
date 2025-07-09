"use client";

import { ChatHistory } from "@/components/Chat/ChatHistory";
import { ChatInterface } from "@/components/Chat/ChatInterface";
import { Header } from "@/components/Layout/Header";
import { RightPanel } from "@/components/Layout/RightPanel";
import { FileTreeSidebar } from "@/components/Sidebar/FileTreeSidebar";
import { useProjectStore } from "@/store/useProjectStore";
import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function HomePage() {
  const { isFileTreeCollapsed, isChatHistoryOpen, toggleChatHistory } =
    useProjectStore();
  const { loadProject, loadChatSessions, project, chatSessions, activeChatId } =
    useProjectStore();

  useEffect(() => {
    // Only run on first mount
    async function init() {
      const projects = await useProjectStore.getState().fetchProjects();
      if (projects.length > 0) {
        await loadProject(projects[0].id);
        await loadChatSessions(projects[0].id);
      }
    }
    if (!project || !activeChatId) {
      init();
    }
  }, [loadProject, loadChatSessions, project, activeChatId]);

  // Calculate dynamic panel sizes that always add up to 100%
  const chatHistorySize = isChatHistoryOpen ? 20 : 0;
  const fileTreeSize = !isFileTreeCollapsed ? 15 : 0;
  const chatInterfaceSize = 30;
  const rightPanelSize =
    100 - chatHistorySize - fileTreeSize - chatInterfaceSize;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Chat History Sidebar */}
          {isChatHistoryOpen && (
            <>
              <Panel
                id="chatHistory"
                defaultSize={chatHistorySize}
                minSize={10}
              >
                <div className="h-full border-r bg-card overflow-x-auto min-w-0">
                  <ChatHistory
                    isOpen={isChatHistoryOpen}
                    onClose={toggleChatHistory}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-border cursor-col-resize" />
            </>
          )}

          {/* Chat Interface */}
          <Panel
            id="chatInterface"
            defaultSize={chatInterfaceSize}
            minSize={20}
          >
            <div className="h-full border-r bg-card overflow-x-auto min-w-0">
              <ChatInterface />
            </div>
          </Panel>
          <PanelResizeHandle className="w-1 bg-border cursor-col-resize" />

          {/* File Tree Sidebar */}
          {!isFileTreeCollapsed && (
            <>
              <Panel id="fileTree" defaultSize={fileTreeSize} minSize={10}>
                <div className="h-full border-r bg-card overflow-x-auto min-w-0">
                  <FileTreeSidebar />
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-border cursor-col-resize" />
            </>
          )}

          {/* Right Panel */}
          <Panel id="rightPanel" defaultSize={rightPanelSize} minSize={20}>
            <div className="h-full bg-background overflow-x-auto min-w-0">
              <RightPanel />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
